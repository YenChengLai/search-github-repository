import * as domUtils from "./dom-utils";
import * as dataUtils from "./data-utils";
import { fromEvent } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  filter
} from "rxjs/operators";

const keyword$ = fromEvent(document.getElementById("keyword"), "input");

keyword$
  .pipe(
    map(event => (event.target as HTMLInputElement).value),
    debounceTime(500),
    distinctUntilChanged(),
    filter(keyword => keyword.length >= 3),
    switchMap(keyword => dataUtils.getSuggestions(keyword))
  )
  .subscribe(options => {
    domUtils.fillAutoSuggestions(options);
  });

const search$ = fromEvent(document.getElementById("search"), "click");

search$
  .pipe(
    switchMap(_ =>
      dataUtils.getSearchResult(
        (document.getElementById("keyword") as HTMLInputElement).value
      )
    )
  )
  .subscribe(result => domUtils.fillSearchResult(result));
