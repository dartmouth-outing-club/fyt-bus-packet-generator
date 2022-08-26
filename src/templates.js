/** Sanitize HTML strings with escape characters
 *
 * tl;dr use this to create safe HTML files. Only insert untrusted text, not
 * untrusted attributes i.e. item in `<li>${item}` can be untrusted, but not
 * className in `<li class=${className}>`.
 *
 * Inserting HTML into the document dynamically creates securtiy risks,
 * specifically the risk that a malicious actor will insert script tags into
 * user-supplied input. This kind of vulnerability is called a Cross-Site
 * Scripting (XSS) attack.
 *
 * In order to mitigate that, we escape certain control characters so that HTML
 * will know to render them, and not use them for control flow. Prepending
 * "html" in front of template strings will automatically escape the characters
 * supplied as values.
 *
 * Note that we don't escaped the entire string, *just the values*. That's
 * because we don't want to escape the actual tags (<tr>, <p>, and so forth)
 * that we're trying to build, only the parts that someone could insert an
 * unwanted tag.
 *
 * Additionally, if you provide an array as a template value, it will return
 * the result of joining that array with newline characters. So for instance:
 *
 *  const list = ['<li>home', '<li>About']
 *  html`<ul>${list}</ul>`
 *
 * would become:
 *  `<ul><li>Home
 *  <li>About<\ul>`
 *
 * The joining does not perform any further sanitization on values in the
 * array, so make sure that you only create such arrays with sanitized html
 * template literals. It should be pretty intuitive, but check some of the
 * simpler usages (in, say, `stops.js`) for examples.
 */
export function html (strings, ...values) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&grave;',
    '=': '&#x3D;'
  }
  const regex = /[&<>"'`=\/]/g // Match any of the characters inside /[ ... ]/

  const sanitizedValues = values
    .map(value => (
      Array.isArray(value)
        ? value.join('\n') // If it's an array, join the strings with newlines
        : value.toString().replace(regex, match => entityMap[match]) // Else, escape the string value
    ))

  // Using the sanitized values, perform the regular templatization process
  // i.e. substitute the values into the string
  return String.raw({ raw: strings }, ...sanitizedValues)
}
