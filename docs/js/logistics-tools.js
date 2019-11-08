let scMain = (source, dest) => {
  let data = { count: 5000, fields: 'tracking_number', q: 'trunk_container:' + source }
  $.getJSON('/consignments/', data)
  .done((cons) => {
    if (cons.length === 0) {
      $('#lt_results').html($('<div>', {class: 'lt-error'}).text('No records returned for ' + source))
    } else {
      $('#lt_results').html($('<div>', {id: 'sc_results'}))
      $.each(cons, (_i, c) => {
        let jqxhr = $.post('/trunkcontainers/' + dest + '/scan/' + c.tracking_number)
        jqxhr.always(() => {
          let row = $('<div>', { class: 'sc-row' })
          row.append($('<div>', { class: 'sc-col-l' }).text(c.tracking_number))
          let mesg = 'Record moved to ' + dest
          let cell = $('<div>', { class: 'sc-col-r' })
          if (jqxhr.status !== 204) {
            mesg = jqxhr.status + ': Error adding record to ' + dest
            cell.addClass('sc-error')
          }
          cell.text(mesg)
          row.append(cell)
          $('#sc_results').append(row)
        })
      })
    }
  })
}

let ciMain = (data) => {
  $.getJSON('/consignments/', data).done((json) => {
    let output = $('<div>', {id: 'ci_results'})
    if (json.length > 0) {
      let head = $('<div>', { class: 'ci-row ci-head' })
      $.each(Object.keys(json[0]), (_i, k) => head.append($('<div>').text(k)))
      output.append(head)
      $.each(json, (_i, o ) => {
        let row = $('<div>', { class: 'ci-row' })
        $.each(o, (k, v) => $('<div>', {class: 'ci-' + k}).text(v).appendTo(row))
        output.append(row)
      })
    } else {
      output = $('<div>', {class: 'sc-row lt-error'}).text('Query returned no results')
    }
    $('#lt_results').html(output)
  })
  .fail((o, s, e) => {
    console.error('Ooops, CI GET Error: ' + s + '\n' + e)
    $('#lt_results').html($('<pre>').text(o))
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
    .append($('<input>', { id: 'sc_old', class: 'lt-advance' }).attr(scValid))
    .append($('<input>', { id: 'sc_new', class: 'lt-advance' }).attr(scValid))
    .append($('<button>', { id: 'sc_btn', class: 'lt-advance' }).text('Move Records')))

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
