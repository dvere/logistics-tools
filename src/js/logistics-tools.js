let getEvents = (id) => $.getJSON('/trunkcontainers/' + id + '/events')
let showResults = (r) => $('#lt_results').html(r)
let postCons = (record, dest) => $.post('/trunkcontainers/' + dest + '/scan/' + record)

let scMain = (source, dest) => {
  let id = Number(source.replace(/\D/g, ''))
  let cons = []

  getEvents(id).done((events) => {
    $.each(events, (_i, e) => {
      let bc = e.description.split(' ')[1]
      if (bc.match(/^PCS[0-9]{9}$/)) cons.push(bc)
    })
    if (cons.length === 0) {
      showResults($('<div>', {class: 'lt-error'}).text('No records returned for ' + source))
    } else {
      showResults($('<div>', {id: 'sc_results'}))
      $.each(cons, (_i, c) => {
        let jqxhr = $.post('/trunkcontainers/' + dest + '/scan/' + c)
        .done((_d) => {
          let r = [{barcode: c, status: jqxhr.status}]
          let html = '<pre>' + JSON.stringify(r, undefined, 2) + '</pre>'
          $('#sc_results').append($('<div', {class: 'sc-row'}).html(html))
        })
      })
    }
  })
}

let ciMain = (data) => {
  let url = '/consignments/'
  let html = ''
  $.getJSON(url, data)
  .done((json) => {
    if (json.length > 0) {
      html = '<pre>' + JSON.stringify(json, undefined, 2) + '</pre>'
    } else {
      html = $('<div>', {class: 'lt-error'}).text('Query returned no results')
    }
    showResults(html)
  })
  .fail((o, s, e) => {
    console.error('Ooops, CI GET Error: ' + e + '\n' + e)
    showResults($('<pre>').text(o))
  })
}

let addPartsToDOM = () => {
  var lt = 'https://dvere.github.io/logistics-tools/'

  $('<link>', {
    id: 'lt-style',
    rel: 'stylesheet',
    href: lt + 'css/logistics-tools.css?v=' + $.now()
  })
  .appendTo($('head'))

  var ltContainer = $('<div>', { id: 'lt_container' })
  .append($('<button>', { id: 'lt_ci', class: 'lt-button', text: 'Consignments Inspector' }))
  .append($('<button>', { id: 'lt_ac', class: 'lt-button', text: 'Auto Containers' }))
  .append($('<button>', { id: 'lt_sc', class: 'lt-button', text: 'Swap Containers' }))
  .append($('<div>', { id: 'lt_insert' }))
  .append($('<div>', { id: 'lt_results' }))

  $('div.breadcrumbs').hide()
  $('div.page-content > div > div')
  .empty()
  .append(ltContainer)

  let ciStatus = ['RECEIVED SC', 'COLLECTED', 'ROUTED', 'RECONCILED']

  let ciForm = $('<div>', { id: 'ci_tab', class: 'lt-tab' })
  .append($('<div>', { id: 'ci_form' })
    .append($('<input>', { id:'ci_date', type:'date' }))
    .append($('<select>', { id: 'ci_status' }))
    .append($('<button>', { id: 'ci_btn', text: 'Look up collections' })))

  $('#lt_insert')
  .append(ciForm)

  $.each(ciStatus, (_i, v) => $('<option>', { value: v, text: v }).appendTo($('#ci_status')))

  $('#ci_btn').click(() => {
    let ciFields = [
      'tracking_number',
      'requested_route',
      'consolidation_id',
      'location',
      'delivery_address_type',
      'package_type',
      'status'
    ]
    let ciData = {
      q: 'collected:SW',
      count: 1000,
      client_id: 11270,
      fields: ciFields.join(),
      received_at: $('#ci_date').val(),
      status: $('#ci_status').val(),
      location: 'SWINDON'
    }
    ciMain(ciData)
  })

  let scRegex = '(CSTC|OOC)[0-9]{8}'
  let scValid = { required: 'required',  pattern: scRegex }

  let scForm = $('<div>', { id: 'sc_tab', class: 'lt-tab' })
  .append($('<div>', { id: 'ci_form' })
    .append($('<input>', { id: 'sc_old' }).attr(scValid))
    .append($('<input>', { id: 'sc_new' }).attr(scValid))
    .append($('<button>', { id: 'sc_btn' }).text('Move Records')))

  $('#lt_insert')
  .append(scForm)

  $('#sc_btn').click(() => {
    let source = $('#sc_old').val().trim()
    let dest = $('#sc_new').val().trim()
    scMain(source, dest)
  })

  $('#lt_ci').on('click',() => {
    $('.lt-tab').hide()
    $('#ci_tab').show()
  })
  $('#lt_sc').on('click',() => {
    $('.lt-tab').hide()
    $('#sc_tab').show()
    $('#sc_old').focus()
  })
}

$.when($.ready).then(function() {
  addPartsToDOM();
})
