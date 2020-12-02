import * as domUtils from "./dom-utils";
import * as dataUtils from "./data-utils";
import { BehaviorSubject, fromEvent } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  filter,
  shareReplay,
  take,
  startWith
} from "rxjs/operators";

const keyword$ = fromEvent(document.getElementById("keyword"), "input").pipe(
  map(event => (event.target as HTMLInputElement).value),
  startWith(""), // prevent searchByKeyword$ have no value to initiate
  shareReplay(1)
);

keyword$
  .pipe(
    debounceTime(500), // wait for half a minute
    distinctUntilChanged(), // triggered only when value changed
    filter(keyword => keyword.length >= 3),
    switchMap(keyword => dataUtils.getSuggestions(keyword))
  )
  .subscribe(options => {
    domUtils.fillAutoSuggestions(options);
  });

const keywordForSearch$ = keyword$.pipe(take(1)); // take value form keyword$

const search$ = fromEvent(document.getElementById("search"), "click");

const searchByKeyword$ = search$.pipe(
  switchMap(_ => keywordForSearch$),
  filter(keyword => !!keyword)
);

searchByKeyword$
  .pipe(switchMap(keyword => dataUtils.getSearchResult(keyword)))
  .subscribe(result => domUtils.fillSearchResult(result));

const sortedBy$ = new BehaviorSubject({ sort: "stars", order: "desc" });

const changeSort = (sortField: string) => {
  if (sortField === sortedBy$.value.sort) {
    sortedBy$.next({
      sort: sortField,
      order: sortedBy$.value.order === "asc" ? "desc" : "asc"
    });
  } else {
    sortedBy$.next({
      sort: sortField,
      order: "desc"
    });
  }
};

fromEvent(document.getElementById("sort-stars"), "click").subscribe(_ => {
  changeSort("stars");
});
fromEvent(document.getElementById("sort-forks"), "click").subscribe(_ => {
  changeSort("forks");
});
