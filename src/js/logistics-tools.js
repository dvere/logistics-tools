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
    $('#lt_results').text(JSON.stringify(result, undefined, 2))
  })
}

let ciMain = (data) => {
  let url = '/consignments/'

  $.getJSON(url, data)
  .done((json) => {
    if (json.length > 0) {
      $('#lt_results').text(JSON.stringify(json, undefined, 2))
    } else {
      $('#lt_results').text('Lookup returned no consignments.')
    }
  })
  .fail((o, s, e) => {
    $('#lt_results').text(s)
    console.log('Ooops, CI Error: ' + e + '\n' + o)
  })
}

function addPartsToDOM(){
  var lt = 'https://dvere.github.io/logistics-tools/'

  $('<link>', {
    id: 'lt-style',
    rel: 'stylesheet',
    href: lt + 'css/logistics-tools.min.css?v=' + $.now()
  })
  .appendTo($('head'))

  var ltContainer = $('<div>', { id: 'lt_container' })
  .append($('<button>', { id: 'ci', class: 'lt-button', text: 'Consignments Inspector'}))
  .append($('<button>', { id: 'ac', class: 'lt-button', text: 'Auto Containers' }))
  .append($('<button>', { id: 'sc', class: 'lt-button', text: 'Swap Containers' }))
  .append($('<div>', { id: 'lt_insert' }))
  .append($('<div>', { id: 'lt_results' }))

  $('div.breadcrumbs').hide()
  $('div.page-content > div > div')
  .empty()
  .append(ltContainer)

  // ciForm
  let ciStatus = ['RECEIVED SC', 'COLLECTED', 'ROUTED', 'RECONCILED']

  let ciForm = $('<div>', {id: 'ciForm', class: 'lt-tab'})
  .append($('<input>', { id:'ci_date', type:'date'}))
  .append($('<select>', {id: 'ci_status'}))
  .append($('<button>', { id: 'ci_btn', text: 'Look up collections'}))

  $('#lt_insert')
  .append(ciForm)

  $.each(ciStatus, (_i, v) => $('<option>', { value: v, text: v }).appendTo($('#ci_status')))

  $('#ci_btn').click(() => {
    let fields = [
      'tracking_number',
      'requested_route',
      'consolidation_id',
      'location',
      'delivery_address_type',
      'package_type',
      'status'
    ]
    let data = {
      q: 'collected:SW',
      count: 1000,
      client_id: 11270,
      fields: fields.join(),
      received_at: $('#ci_date').val(),
      status: $('#ci_status').val(),
      location: 'SWINDON'
    }
    ciMain(data)
  })

  // scForm
  let tcregex = '(CSTC|OOC)[0-9]{8}'
  let scValid = { required: 'required',  pattern: tcregex }

  let scForm = $('<div>', { id: 'scForm', class: 'lt-tab' })
  .append($('<input>', { id: 'sc_old' }).attr(scValid))
  .append($('<input>', { id: 'sc_new' }).attr(scValid))
  .append($('<button>', { id: 'sc_btn' }).text('Move Records'))

  $('#lt_insert')
  .append(scForm)

  $('#sc_btn').click(() => {
    let source = $('#sc_old').val().trim()
    let dest = $('#sc_new').val().trim()
    scMain(source, dest)
  })

  $('#ci').click(() => {
    $('.lt-tab').hide()
    $('#ciForm').show()
  })
  $('#sc').click(() => {
    $('.lt-tab').hide()
    $('#scForm').show()
    $('#old_ctr').focus()
  })
}

$.when($.ready).then(function() {
  addPartsToDOM();
})
