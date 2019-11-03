let result = {}
result.records = []

const barcodeToID = barcode => 
  Number(barcode.replace(/\D/g,''))

const getEvents = id => 
  $.getJSON('/trunkcontainers/'+id+'/events')

const scanRecord = (record, container) =>
  $.post('/truncontainers/'+container+'/scan/'+record)

const getRecords = (container) => {
  let id = barcodeToID(container)
  getEvents(id).done((events) => {
    $.each(events, (_i,e) => {
      let bc = e.description.split(' ')[1]
      if (bc.match(/^PCS[0-9]{9}$/)) cons.push(bc)
    })
  })
  return cons
}

let swapContainers = () => {
  getRecords(result.oldContainer)
  .done((records) => {
    if (records.length !== 0) {
      $.each(records,(_i,r) => {
        scanRecord(r, result.newContainer)
        .done((response) => {
          let record = {barcode: r, status: response.status}
          result.records.push(record)
        })
      })
    } else {
      result.error = 1
      result.errormessage = 'Could not get records for ' + result.oldContainer
    }
    showResult()
  })
}

let processRequest = () => {
  result.oldContainer = $('#oldCtr').val().trim()
  result.newContainer = $('#newCtr').val().trim()
  swapContainers()
}

let showResult = () => {
  $('#switch-results')
  .text(JSON.stringify(result,undefined,2))
}

function addForm() {

  let regex = '(CSTC|OOC)[0-9]{8}'

  var aForm = $('<div>', {id: 'cForm'})
  .append($('<input>', {
    id:'oldCtr',
    required: 'required',
    pattern: regex
  }))
  .append($('<input>', {
    id:'newCtr',
    required: 'required',
    pattern: regex
  }))
  .append($('<button>', {
    class: 'lt-button',
    text: 'Move Records'
  })
  .click(function() {
    processRequest()
  }))

  $('#ltInsert')
  .empty()
  .append(aForm)
  .append($('<div>', { id: 'switch-results'}))

  $('#oldContainer').focus()
}

$.when($.ready).then(function() {
	addForm();
})
