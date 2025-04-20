import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replace',
  standalone: true, // Make it standalone if your project uses standalone components
})
export class ReplacePipe implements PipeTransform {
  transform(
    value: string,
    strToReplace: string,
    replacementStr: string
  ): string {
    if (!value || strToReplace === undefined || replacementStr === undefined) {
      return value;
    }
    // Use a global regex replace to handle multiple spaces if needed
    return value.replace(new RegExp(strToReplace, 'g'), replacementStr);
  }
}
