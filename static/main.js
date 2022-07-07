async function deletePacket (name) {
  await fetch(`/api/packet/${name}`, { method: 'DELETE' })
  location.reload()
  console.log('Failed to delete packet')
}

function addNewWaypoint () {
  const form = document.querySelector('form')
  const { add, ['route-start']: start } = form
  const newFieldset = start.cloneNode(true)
  const num = document.querySelectorAll('fieldset').length - INITIAL_FIELDSETS + 1

  newFieldset.setAttribute('name', `stop${num}`)
  newFieldset.children[0].innerHTML = `Stop ${num}`
  newFieldset.children[1].setAttribute('for', `stop${num}-location`)
  newFieldset.children[1].attributes.innerHTML = 'Stop location:'
  newFieldset.children[2].setAttribute('id', `stop${num}-location`)
  newFieldset.children[2].setAttribute('name', `stop${num}-location`)
  newFieldset.children[3].classList.remove('nodisplay')

  form.insertBefore(newFieldset, add)
}


