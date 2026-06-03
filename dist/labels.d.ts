/**
 * Standard issue-label set, with their resolved colors and human-readable
 * descriptions. The array is the only thing you need; `Label`describes a row.
 *
 * @summary 286-label issue taxonomy with sRGB colors and descriptions
 * @category labels
 *
 * @example
 * ```ts
 * import { labels, type Label } from 'issue_labels';
 *
 * const bugs: readonly Label[] = labels.filter(l => l.name === 'Bug');
 * console.log(bugs[0]?.color);  //=> "#ff3f00"
 * ```
 *
 * @since 0.3.0
 * @author John Haugeland
 *
 * @privateRemarks
 * Generated from src/data/standard_issue_label.json by
 * src/build_js/export_labels_ts.cjs (`npm run export:labels`). To regenerate
 * after the visualizer sim and bake step update label colors, re-run that
 * script -- it rewrites only the data rows, leaving this header intact. The
 * array is frozen-by-type (readonly) so consumers can't mutate it accidentally.
 */
export interface Label {
    readonly name: string;
    readonly color: string;
    readonly description: string;
}
export declare const labels: readonly Label[];
//# sourceMappingURL=labels.d.ts.map