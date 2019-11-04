let scResult = {}
scResult.records = []

const barcodeToID = barcode =>
  Number(barcode.replace(/\D/g, ''))

const getEvents = id =>
  $.getJSON('/trunkcontainers/' + id + '/events')

const scanRecord = (record, container) =>
  $.post('/truncontainers/' + container + '/scan/' + record)

const getRecords = (container) => {
  let id = barcodeToID(container)
  getEvents(id).done((events) => {
    $.each(events, (_i, e) => {
      let bc = e.description.split(' ')[1]
      if (bc.match(/^PCS[0-9]{9}$/)) cons.push(bc)
    })
  })
  return cons
}

let swapContainers = () => {
  getRecords(scResult.oldContainer)
    .done((records) => {
      if (records.length !== 0) {
        $.each(records, (_i, r) => {
          scanRecord(r, scResult.newContainer)
            .done((response) => {
              let record = { barcode: r, status: response.status }
              scResult.records.push(record)
            })
        })
      } else {
        scResult.error = 1
        scResult.errormessage = 'Could not get records for ' + scResult.oldContainer
      }
      showResult()
    })
}

let processRequest = () => {
  scResult.oldContainer = $('#oldCtr').val().trim()
  scResult.newContainer = $('#newCtr').val().trim()
  swapContainers()
}

let showResult = () => {
  $('#switch-results')
    .text(JSON.stringify(scResult, undefined, 2))
}

function addForm() {

  let regex = '(CSTC|OOC)[0-9]{8}'

  var aForm = $('<div>', { id: 'cForm' })
    .append($('<input>', {
      id: 'oldCtr',
      required: 'required',
      pattern: regex
    }))
    .append($('<input>', {
      id: 'newCtr',
      required: 'required',
      pattern: regex
    }))
    .append($('<button>', {
      class: 'lt-button',
      text: 'Move Records'
    })
      .click(function () {
        processRequest()
      }))

  $('#ltInsert')
    .empty()
    .append(aForm)
    .append($('<div>', { id: 'switch-results' }))

  $('#oldContainer').focus()
}

$.when($.ready).then(function () {
  addForm();
})
