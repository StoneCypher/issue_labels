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
 * Generated from src/data/prototype.json. To regenerate after the visualizer
 * sim updates label positions, capture a new prototype.json and re-run the
 * one-off generator. The array is frozen-by-type (readonly) so consumers
 * can't mutate it accidentally.
 */
export interface Label {
    readonly name: string;
    readonly color: string;
    readonly description: string;
}
export declare const labels: readonly Label[];
//# sourceMappingURL=labels.d.ts.map