/*
 * Copyright (c) 2019 Anthony La Porte <ant@dvere.uk>
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

const checkSSL = () => {
  if (location.protocol === 'https:') {
    return true
  }
  if (confirm( 
      'Logistics Tools requires a secure connection in order to run\n\n' +
      'Click "OK" to reload this page using https, you can then re-run Logistics Tools\n\n' +  
      'Click "Cancel" to abort the loading of Logistics Tools and reload this page'
  )) {
    location.assign(location.href.replace('http:','https:'))
  } else {
    location.reload()
  }
}

const addPartsToDOM = (config, svc, clients) => {
  let lt = 'https://dvere.github.io/logistics-tools/'
  let $pageContent = $('#main-container > div:first-child > div.page-content')
  
  $('<link>', {
    id: 'lt_style',
    rel: 'stylesheet',
    href: `${lt}css/logisticsTools.css?v=${$.now()}`
  })
  .appendTo($('head'))

  $('<script>',{
    id: 'lt_func',
    src: `${lt}js/logisticsFunctions.js?v=${$.now()}` 
  })
  .appendTo($('body'))

  let ciData = {}
  ciData.query = {
    q: 'collected:' + svc.code,
    count: 5000,
    location: svc.description
  }

  let ciOpts = [ 'RECEIVED', 'COLLECTED', 'ROUTED', 'RECONCILED' ]
  let usOpts = [ 'COLLECT CLIENT', 'RECEIVED SC', 'LABEL PRINTED', 'PARCEL SCAN' ]
  let scRegex = '(CAP)?(TRNK|CSTC|OOC)[0-9]{8}'
  let scAttr = { required: 'required',  pattern: scRegex, autocomplete: 'off' }

  let ltMenu = $('<div>', { id: 'lt_menu' })
  .append($('<button>', { id: 'lt_ci', class: 'lt-button', text: 'Consignments Inspector' }))
  .append($('<button>', { id: 'lt_ac', class: 'lt-button', text: 'Auto Containers' }))
  .append($('<button>', { id: 'lt_lp', class: 'lt-button', text: 'Label Packs' }))
  .append($('<button>', { id: 'lt_sc', class: 'lt-button', text: 'Swap Containers' }))
  .append($('<button>', { id: 'lt_gp', class: 'lt-button', text: 'Print GP Containers' }))
  .append($('<button>', { id: 'lt_bp', class: 'lt-button', text: 'Bulk POD' }))
  .append($('<button>', { id: 'lt_us', class: 'lt-button', text: 'Bulk Update Status' }))

  let ciForm = $('<div>', { id: 'ci_tab', class: 'lt-tab' })
    .append($('<div>', { id: 'ci_form' })
      .append($('<input>', { id: 'ci_date', type:'date' }))
      .append($('<select>', { id: 'ci_status' }))
      .append($('<select>', { id: 'ci_client' }))
      .append($('<button>', { id: 'ci_btn', class: 'lt-button', text: 'Look up collections' }))
      .append($('<label>').css({ gridColumn: '1 / 3', marginBottom: '-0.57em' })
        .html('<input id="ci_ncr" type="checkbox" />&nbsp;Exclude records processed to trunk container')))

  let acForm = $('<div>', { id: 'ac_tab', class: 'lt-tab'})
    .append($('<div>', { id: 'ac_form' })
      .append($('<input>', { id: 'ac_ti' }).attr({autocomplete: 'off'}))
      .append($('<textarea>', { id:'ac_data' }))
      .append($('<button>', { id: 'ac_btn', class: 'lt-button', text: 'Process' }))
      .append($('<button>', { id: 'ac_clr', class: 'lt-button', text: 'Clear' })))

  let lpForm = $('<div>', { id: 'lp_tab', class: 'lt-tab' })
    .append($('<div>', { id: 'lp_form' })
      .append($('<input>', { id: 'lp_ti' }).attr({autocomplete: 'off' }))
      .append($('<textarea>', { id:'lp_data' }))
      .append($('<button>', { id: 'lp_btn', class: 'lt-button', text: 'Process' }))
      .append($('<button>', { id: 'lp_clr', class: 'lt-button', text: 'Clear' })))
  
  let scForm = $('<div>', { id: 'sc_tab', class: 'lt-tab' })
    .append($('<div>', { id: 'sc_form' })
      .append($('<input>', { id: 'sc_old', class: 'lt-input' }).attr(scAttr))
      .append($('<input>', { id: 'sc_new', class: 'lt-input' }).attr(scAttr))
      .append($('<button>', { id: 'sc_btn', class: 'lt-button' }).text('Move Records')))

  let gpForm = $('<div>', { id: 'gp_tab', class: 'lt-tab'})

  let bpForm = $('<div>', { id: 'bp_tab', class: 'lt-tab'})
    .append($('<div>', { id: 'bp_form'})
      .append($('<input>', { id: 'bp_name', class: 'lt-input', placeholder: 'Receiver'}))
      .append($('<input>', { id: 'bp_courier', class: 'lt-input', placeholder: 'Driver Id'}))
      .append($('<input>', { id: 'bp_time', type:'time' }))
      .append($('<input>', { id: 'bp_date', type:'date' }))
      .append($('<textarea>', { id:'bp_data' }))
      .append($('<button>', { id: 'bp_btn', class: 'lt-button', text: 'Process' }))
      .append($('<button>', { id: 'bp_clr', class: 'lt-button', text: 'Clear' })))

  let usForm = $('<div>', { id: 'us_tab', class: 'lt-tab'})
    .append($('<div>', { id: 'us_form'})
      .append($('<div>', { text: 'New Status:'}))
      .append($('<select>', { id: 'us_status'}))
      .append($('<textarea>', { id:'us_data' }))
      .append($('<button>', { id: 'us_btn', class: 'lt-button', text: 'Process' }))
      .append($('<button>', { id: 'us_clr', class: 'lt-button', text: 'Clear' })))
  
  let ltClose = $('<span>', {id: 'lt_close', title: 'Close Logistics Tools'})
    .html("&#10006;")
    .click(() => location.reload())
  
  let ltContainer = $('<div>', { id: 'lt_container' })
    .append(ltMenu)
    .append($('<div>', { id: 'lt_insert' })
      .append(ciForm)
      .append(acForm)
      .append(lpForm)
      .append(scForm)
      .append(gpForm)
      .append(bpForm)
      .append(usForm))
    .append($('<div>', { id: 'lt_results' }))
    .append(ltClose)

  $pageContent.prepend(ltContainer)

  $.each(ciOpts, (_i, v) => $('<option>', { value: v, text: v })
    .appendTo($('#ci_status')))
  
  $.each(usOpts, (_i, v) => $('<option>', { value: v, text: v })
    .appendTo($('#us_status')))

  $.each(clients, (_i, v) => {
    let opt = $('<option>', { value: v.id, text: v.name})
    if(v.id == 11270) {
      opt = $('<option>', { value: v.id, text: v.name, selected: 'selected'})
    }
    opt.appendTo($('#ci_client'))})

  $('#ci_btn').click(() => {
    ciData.query.received_at = $('#ci_date').val()
    ciData.query.status = $('#ci_status').val()
    ciData.query.client_id = $('#ci_client').val()
    ciData.ncr = ($('#ci_ncr').is(':checked')) ? 1 : 0 
    ciMain(ciData)
  })

  $('#ac_ti').keypress((e) => {
    if (e.which == 13) {
      let audio = new Audio('/audio/success')
      audio.play()
      $('#ac_data').val((_i, text) => `${text + $('#ac_ti').val()}\n`)
      $('#ac_data').scrollTop($('#ac_data')[0].scrollHeight)
      $('#ac_ti').select()
      return false
    }
  })

  $('#lp_ti').keypress((e) => {
    if (e.which == 13) {
      let audio = new Audio('/audio/success')
      audio.play()
      $('#lp_data').val((_i, text) => `${text + $('#lp_ti').val()}\n`)
      $('#lp_data').scrollTop($('#lp_data')[0].scrollHeight)
      $('#lp_ti').select()
      return false
    }
  })

  $('#ac_btn').click(() => {
    let regex = /^PCS[0-9]{9}|(CAP)?(TRNK|CSLC|CSTC|OOC)[0-9]{8}$/
		let acData = $('#ac_data').val().toUpperCase().trim().split('\n')
		if (validateBarcodes(acData, regex)) {
      $('#ac_ti').focus()
			acMain(acData)
		} else {
			alert('Invalid barcode data, please check input and try again')
			return false
		}
	})

  $('#ac_clr').click(() => {
    $('#ac_data').val('')
    $('#lt_results').empty()
    $('#ac_ti').focus()
  })

  $('#lp_btn').click(() => {
    let regex = /^PCS[0-9]{9}$/
		let lpData = $('#lp_data').val().toUpperCase().trim().split('\n')
		if (validateBarcodes(lpData, regex)) {
      $('#lp_ti').focus()
			lpMain(lpData)
		} else {
			alert('Invalid barcode data, please check input and try again')
			return false
		}
	})

  $('#lp_clr').click(() => {
    $('#lp_data').val('')
    $('#lt_results').empty()
    $('#lp_ti').focus()
  })

  $('#sc_btn').click(() => {
    let source = $('#sc_old').val().trim()
    let dest = $('#sc_new').val().trim()
    scMain(source, dest)
  })

  $('#bp_btn').click(() => {
    let bpData = {
      data: $('#bp_data').val(),
      name: $('#bp_name').val(),
      key: $('#bp_courier').val().trim(),
      date: $('#bp_date').val(),
      time: $('#bp_time').val()
    }
    bpMain(bpData)
	})

  $('#bp_clr').click(() => {
    $('#bp_data').val('')
    $('#lt_results').empty()
    $('#bp_name').focus()
  })

  $('#us_btn').click(() => {
    let usData = {
      data: $('#us_data').val(),
      status: $('#us_status').val()
    }
    usMain(usData)
	})

  $('#us_clr').click(() => {
    $('#us_data').val('')
    $('#lt_results').empty()
    $('#us_status').focus()
  })

  $('#lt_ci').click(() => {
    $('.lt-tab').hide()
    $('#lt_results').empty()
    $('#ci_tab').show()
  })
  $('#lt_ac').click(() => {
    $('.lt-tab').hide()
    $('#lt_results').empty()
    $('#ac_tab').show()
    $('#ac_ti').focus()
  })
  $('#lt_lp').click(() => {
    $('.lt-tab').hide()
    $('#lt_results').empty()
    $('#lp_tab').show()
    $('#lp_ti').focus()
  })
  $('#lt_sc').click(() => {
    $('.lt-tab').hide()
    $('#lt_results').empty()
    $('#sc_tab').show()
    $('#sc_old').focus()
  })
  $('#lt_gp').click(() => {
    $('.lt-tab').hide()
    $('#lt_results').empty()
    $('#gp_select').html(populateGPs(config))
    $('#gp_tab').show()
  })
  $('#lt_bp').click(() => {
    $('.lt-tab').hide()
    $('#lt_results').empty()
    $('#bp_tab').show()
    $('#bp_name').focus()
  })
  $('#lt_us').click(() => {
    $('.lt-tab').hide()
    $('#lt_results').empty()
    $('#us_tab').show()
    $('#us_status').focus()
  })
}
;
(async () => {
  if (checkSSL()) {
    const config = await fetch('/user/me').then(r => r.json())
    const svc = await fetch(`/servicecentres/${config.service_centre}`).then(r => r.json())
    const clients = await fetch('/client/').then(r=>r.json())
    if(!config.consignment_printer_name) {
      config.consignment_printer_name = config.container_printer_name = svc.label_printer_name
    }
    addPartsToDOM(config, svc, clients)
  } else {
    return false
  }
})()
