let switchContainers = {
  swapContainers: () => {
    let result = {}
    let source = $('#oldCtr').val().trim()
    let dest = $('#newCtr').val().trim()
    let id = Number(source.replace(/\D/g, ''))

    result.oldContainer = source
    result.newContainer = dest
    result.consignments = []

    $.getJSON('/trunkcontainers/' + id + '/events')
    .done((events) => {
      let cons = []
      $.each(events, (_i, e) => {
        let bc = e.description.split(' ')[1]
        if (bc.match(/^PCS[0-9]{9}$/)) cons.push(bc)
      })
      return cons
    })
    .then((records) => {
      if (records.length !== 0) {
        $.each(records, (_i, record) => {
          $.post('/trunkcontainers/' + dest + '/scan/' + record)
            .done((response) => {
              let r = { barcode: record, status: response.status }
              result.consignments.push(r)
            })
        })
      } else {
        result.error = 1
        result.errormessage = 'Could not get records for ' + source
      }
      $('#switch-results').text(JSON.stringify(result, undefined, 2))
    })
  },
  prepare: () => {
    let tcregex = '(CSTC|OOC)[0-9]{8}'

    let form = $('<div>', { id: 'cForm' })
      .append($('<input>', {
        id: 'oldCtr',
        required: 'required',
        pattern: tcregex
      }))
      .append($('<input>', {
        id: 'newCtr',
        required: 'required',
        pattern: tcregex
      }))
      .append($('<button>', {
        text: 'Move Records',
        onclick: switchContainers.swapContainers
      }))

    $('#ltInsert')
      .empty()
      .append(form)
      .append($('<div>', { id: 'switch-results' }))

    $('#oldCtr').focus()
  }
}
export default switchContainers
