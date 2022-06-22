export function createTitle (title) {
  return `<h1>${title}</h1>`
}

export function createStep (step) {
  const distance = step.distanceText || '(Missing distance)'
  return `<p>${step.instructionsHtml} - ${distance}</p>`
}

export function createLeg (leg) {
  const stepsText = leg.steps
    .map(createStep)
    .join('\n')
  return `<h2>${leg.startAddress}</h2>\n` + stepsText
}
