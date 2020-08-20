import { AbstractControl } from '@angular/forms';
import * as validUrl from 'url-validation';
export function cvalidate(control: AbstractControl): {
    [key: string]: boolean
} | null {
    if (!validUrl(control.value)) {
        return { 'name1': true };
    } else {
        return null;
    }
}
