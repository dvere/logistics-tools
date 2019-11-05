let scMain = (source, dest) => {
  let result = {}

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
}
let scPrepare = () => {
}

function addPartsToDOM(){

  var lt = 'https://dvere.github.io/logistics-tools/'

  $('<link>', {
    id: 'lt-style',
    rel: 'stylesheet',
    href: lt + 'css/logistics-tools.min.css?v=' + $.now()
  })
  .appendTo($('head'))

  var ltContainer = $('<div>', {
    id: 'ltContainer'
  })
  .append($('<button>', {
    class: 'ltButton',
    // onclick: consInspector,
    text: 'Consignments Inspector'
  }))
  .append($('<button>', {
    class: 'ltButton',
    // onclick: autoContainers,
    text: 'Auto Containers'
  }))
  .append($('<button>', {
    class: 'ltButton',
    text: 'Swap Containers'
  }).click(function(){
    $('.lt-tab').hide()
    $('#scForm').show()
  }))
  .append($('<div>', {id: 'ltInsert'}))

  $('div.breadcrumbs').hide()
  $('div.page-content > div > div')
  .empty()
  .append(ltContainer)

  // scForm
  let tcregex = '(CSTC|OOC)[0-9]{8}'
  $('#ltInsert')
  .append($('<div>', {
	id: 'scForm',
	class: 'lt-tab'
  }))
  .append($('<div>', {
	id: 'switch_results'
  }))

  $('#scForm')
  .append($('<input>', {
    id: 'old_ctr',
    required: 'required',
    pattern: tcregex
  }))
  .append($('<input>', {
    id: 'new_ctr',
    required: 'required',
    pattern: tcregex
  }))
  .append($('<button>', {
    id: 'sc_btn',
    text: 'Move Records'
  }))

  $('#sc_button').click(() => {
	let source = $('#old_ctr').val().trim()
    let dest = $('#new_ctr').val().trim()
    scMain(source, dest)
  })
}

$.when($.ready).then(function() {
  addPartsToDOM();
})
