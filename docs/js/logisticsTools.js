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

const addPartsToDOM = (config, svc) => {
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
    client_id: 11270,
    location: svc.description
  }

  let ciOpts = [ 'RECEIVED', 'COLLECTED', 'ROUTED', 'RECONCILED' ]
  let scRegex = '(CAP)?(TRNK|CSTC|OOC)[0-9]{8}'
  let scAttr = { required: 'required',  pattern: scRegex, autocomplete: 'off' }

  let ltMenu = $('<div>', { id: 'lt_menu' })
  .append($('<button>', { id: 'lt_ci', class: 'lt-button', text: 'Consignments Inspector' }))
  .append($('<button>', { id: 'lt_ac', class: 'lt-button', text: 'Auto Containers' }))
  .append($('<button>', { id: 'lt_lp', class: 'lt-button', text: 'Label Packs' }))
  .append($('<button>', { id: 'lt_sc', class: 'lt-button', text: 'Swap Containers' }))
  .append($('<button>', { id: 'lt_gp', class: 'lt-button', text: 'Print GP Containers' }))

  let ciForm = $('<div>', { id: 'ci_tab', class: 'lt-tab' })
    .append($('<div>', { id: 'ci_form' })
      .append($('<input>', { id: 'ci_date', type:'date' }))
      .append($('<select>', { id: 'ci_status' }))
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
      .append(gpForm))
    .append($('<div>', { id: 'lt_results' }))
    .append(ltClose)

  $pageContent.prepend(ltContainer)

  $.each(ciOpts, (_i, v) => $('<option>', { value: v, text: v })
    .appendTo($('#ci_status')))
  
  $('#ci_btn').click(() => {
    ciData.query.received_at = $('#ci_date').val()
    ciData.query.status = $('#ci_status').val()
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
			alert('Invalid Data, please check input and try again')
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
			alert('Invalid Data, please check input and try again')
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
}
;
(async () => {
  if (checkSSL()) {
    const config = await fetch('/user/me').then(r => r.json())
    const svc = await fetch(`/servicecentres/${config.service_centre}`).then(r => r.json())
    if(!config.consignment_printer_name) {
      config.consignment_printer_name = config.container_printer_name = svc.label_printer_name
    }
    addPartsToDOM(config, svc)
  } else {
    return false
  }
})()
