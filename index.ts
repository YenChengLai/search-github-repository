import * as domUtils from "./dom-utils";
import * as dataUtils from "./data-utils";
import { fromEvent } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap
} from "rxjs/operators";

const keyword$ = fromEvent(document.getElementById("keyword"), "input").pipe(
  map(event => (event.target as HTMLInputElement).value)
);

keyword$
  .pipe(
    debounceTime(500),
    distinctUntilChanged(),
    switchMap(keyword => dataUtils.getSuggestions(keyword))
  )
  .subscribe(options => {
    domUtils.fillAutoSuggestions(options);
  });
