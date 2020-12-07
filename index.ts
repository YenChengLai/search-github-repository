import * as domUtils from "./dom-utils";
import * as dataUtils from "./data-utils";
import { BehaviorSubject, fromEvent, merge, combineLatest } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  filter,
  shareReplay,
  take,
  startWith,
  mapTo,
  scan
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

// use BehaviorSubject to give default value
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

// Listener for data counts per page
const perPage$ = fromEvent(document.getElementById("per-page"), "change").pipe(
  map(event => +(event.target as HTMLSelectElement).value)
);

// Listener for previous page button
const previousPage$ = fromEvent(
  document.getElementById("previous-page"),
  "click"
).pipe(mapTo(-1));

// Listener for next page button
const nextPage$ = fromEvent(document.getElementById("next-page"), "click").pipe(
  mapTo(1)
);

// Merge previous and next page as page change listener
const page$ = merge(previousPage$, nextPage$).pipe(
  scan((currentPageIndex, value) => {
    const nextPage = currentPageIndex + value;
    return nextPage < 1 ? 1 : nextPage;
  }, 1)
);

page$.subscribe(page => domUtils.updatePageNumber(page));

sortedBy$
  .pipe(filter(sort => sort.sort === "stars"))
  .subscribe(sort => domUtils.updateStarsSort(sort));

sortedBy$
  .pipe(filter(sort => sort.sort === "forks"))
  .subscribe(sort => domUtils.updateForksSort(sort));

const startSearch$ = combineLatest([
  searchByKeyword$,
  sortedBy$,
  page$.pipe(startWith(1)),
  perPage$.pipe(startWith(10))
]);

const searchResult$ = startSearch$.pipe(
  switchMap(([keyword, sort, page, perPage]) =>
    dataUtils.getSearchResult(keyword, sort.sort, sort.order, page, perPage)
  )
);

searchResult$.subscribe(result => domUtils.fillSearchResult(result));
