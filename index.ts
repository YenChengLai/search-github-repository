import * as domUtils from "./dom-utils";
import * as dataUtils from "./data-utils";
import { fromEvent } from "rxjs";
import { map } from "rxjs/operators";

const keyword$ = fromEvent(document.getElementById("keyword"), "input").pipe(
  map(event => (event.target as HTMLInputElement).value)
);

keyword$.subscribe(console.log);
