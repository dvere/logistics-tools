let ciMain = (data) => {

  console.log(data)
  let query = data.query

  $('#lt_results').html($('<div>',{ class: 'lt-loader' }))

  $.getJSON('/consignments/', query).done((json) => {

    if (data.ncr === 1) {
      filterProcessed(json, query)
    } else {
      ciOutput(json)
    }
  })
  .fail((o, s, e) => {
    console.error('Ooops, CI GET Error: ' + s + '\n' + e)
    $('#lt_results').html($('<pre>').text(o))
  })
}

let filterProcessed = (allCons, q) => {
  q.fields = 'id,trunk_container.barcode'
  $.getJSON('/consignments/', q).done(processedCons => {
    let exclude = []
    $.each(processedCons, (i,p) => exclude.push(p.id))

    let unprocessedCons = $.grep(allCons, c => $.inArray(c.id, exclude), true))
    ciOutput(unprocessedCons)
  })
}

let ciOutput = (cons) => {
  let out_html = $('<table>', {id: 'ci_results'})

  if (cons.length > 0) {
    let head = $('<tr>', { class: 'ci-row ci-head' })

    $.each(Object.keys(cons[0]), (_i, k) => head.append($('<td>').text(k)))
    out_html.append(head)
    $.each(cons, (_i, o ) => {
      let row = $('<tr>', { class: 'ci-row' })
      $.each(o, (k, v) => $('<td>', {class: 'ci-' + k}).text(v).appendTo(row))
      out_html.append(row)
    })
    } else {
      out_html.append($('<tr>', { class: 'sc-row lt-error' }).html('<td>Query returned no results</td>'))
    }
    $('#lt_results').html(out_html)
}

let acMain = (data) => {
  $('#lt_results').html($('<div>',{ class: 'lt-loader' }))
  let containers = []
  var current
  $.each(data, (_i, bc) => {
    if (bc.match(/^PCS[0-9]{9}$/) === null) {
      let t = (bc.match(/^CSLC[0-9]{8}$/)) ? 'location' : 'trunk'
      containers.push({id: bc, type: t, records: []})
      current = bc
    } else {
      let idx = containers.findIndex(e => e.id === current)
      containers[idx].records.push(bc)
    }
  })
  if (containers.length === 0) {
    $('#lt_results').html($('<div>', { class: 'lt-error' }).text('Unable to build list of containers'))
  } else {
    $('#lt_results').html($('<div>', { id: 'ac_results' }))
    $.each(containers, (_i, o) => {
      let row = $('<div>', { id: o.id, class: 'ac-row' })
        .append($('<div>', { class: 'ac-col-l' }).text(o.id))
        .append($('<div>', { class: 'ac-col-r' })
          .append($('<ul>', { class: 'ac-list' })
            .append($('<li>', { class: 'ac-summary' }))))

      $('#ac_results').append(row)

      let errors = 0
      let added = 0
      $.each(o.records, (_i, r) => {
        let jqxhr = $.post('/'+ o.type + 'containers/' + o.id + '/scan/' + r)
        jqxhr.always(() => {

          if (jqxhr.status !== 204) {
            $('#'+ o.id +' ul.ac-list').append($('<li>', { class: 'sc-error' }).text(r + ' - ' + jqxhr.responseJSON.message))
            errors++
          } else {
            added++
          }
          $('#'+ o.id +' li.ac-summary').text('Records Added: ' + added + ', Errors: '+ errors)
        })
      })
    })
  }
}

let scMain = (source, dest) => {
  $('#lt_results').html($('<div>',{ class: 'lt-loader' }))
  let data = { count: 5000, fields: 'tracking_number', q: 'trunk_container:' + source }
  $.getJSON('/consignments/', data)
  .done((cons) => {
    if (cons.length === 0) {
      $('#lt_results').html($('<div>', { class: 'lt-error' }).text('No records returned for ' + source))
    } else {
      $('#lt_results').html($('<div>', { id: 'sc_results' }))
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

let validateBarcodes = (arr) => {
  let regex = /^(PCS[0-9]{9}|(CSTC|CSLC|OOC)[0-9]{8})$/
  let count = 0
	$.each(arr, (_i, bc) => {
		if (bc.match(regex) === null) {
		  count++
		}
	})
  if (count > 0) return false
  return true
}

let addPartsToDOM = (sc) => {
  let lt = 'https://dvere.github.io/logistics-tools/'
  let $pageContent = $('#main-container > div:first-child > div.page-content')
  
  $('<link>', {
    id: 'lt-style',
    rel: 'stylesheet',
    href: lt + 'css/logistics-tools.css?v=' + $.now()
  })
  .appendTo($('head'))

  let ciData = {}
  ciData.query = {
    q: 'collected:' + sc.code,
    count: 5000,
    client_id: 11270,
    location: sc.description,
    fields: 'id,tracking_number,requested_route,consolidation_id,status'
  }
  let ciOpts = [ 'RECEIVED SC', 'COLLECTED', 'ROUTED', 'RECONCILED' ]
  let scRegex = '(CSTC|OOC)[0-9]{8}'
  let scValid = { required: 'required',  pattern: scRegex }

  let ltMenu = $('<div>', { id: 'lt_menu' })
  .append($('<button>', { id: 'lt_ci', class: 'lt-button', text: 'Consignments Inspector' }))
  .append($('<button>', { id: 'lt_ac', class: 'lt-button', text: 'Auto Containers' }))
  .append($('<button>', { id: 'lt_sc', class: 'lt-button', text: 'Swap Containers' }))

  let ciForm = $('<div>', { id: 'ci_tab', class: 'lt-tab' })
  .append($('<div>', { id: 'ci_form' })
    .append($('<input>', { id: 'ci_date', type:'date' }))
    .append($('<select>', { id: 'ci_status' }))
    .append($('<button>', { id: 'ci_btn', class: 'lt-button', text: 'Look up collections' }))
    .append($('<label>').css({gridColumn: '1 / 3'})
      .html('<input id="ci_ncr" type="checkbox" />&nbsp;Exclude records processed to trunk container')))

  let acForm = $('<div>', { id: 'ac_tab', class: 'lt-tab' })
  .append($('<div>', { id: 'ac_form' })
    .append($('<input>', { id: 'ac_ti' }))
    .append($('<textarea>', { id:'ac_data' }))
    .append($('<button>', { id: 'ac_btn', class: 'lt-button', text: 'Process' }))
    .append($('<button>', { id: 'ac_clr', class: 'lt-button', text: 'Clear' })))

  let scForm = $('<div>', { id: 'sc_tab', class: 'lt-tab' })
  .append($('<div>', { id: 'ci_form' })
    .append($('<input>', { id: 'sc_old', class: 'lt-input' }).attr(scValid))
    .append($('<input>', { id: 'sc_new', class: 'lt-input' }).attr(scValid))
    .append($('<button>', { id: 'sc_btn', class: 'lt-button' }).text('Move Records')))

  let ltClose = $('<span>', {id: 'lt_close'})
    .html("&#10006;")
    .click(() =>  $('#lt_container').remove())
  
  let ltContainer = $('<div>', { id: 'lt_container' })
    .append(ltMenu)
    .append($('<div>', { id: 'lt_insert' })
      .append(ciForm)
      .append(acForm)
      .append(scForm))
    .append($('<div>', { id: 'lt_results' }))
    .append(ltClose)

  $pageContent.prepend(ltContainer)

  $.each(ciOpts, (_i, v) => $('<option>', { value: v, text: v }).appendTo($('#ci_status')))
  
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
      $('#ac_data').val((_i, text) => text + $('#ac_ti').val() + '\n')
      $('#ac_data').scrollTop($('#ac_data')[0].scrollHeight)
      $('#ac_ti').select()
      return false
    }
  })
  $('#ac_btn').click(() => {
		let acData = $('#ac_data').val().toUpperCase().trim().split('\n')
		if (validateBarcodes(acData)) {
      $('#ac_ti').focus()
			acMain(acData)
		} else {
			alert('Invalid Data, please check input and try again')
			return false
		}
	})

  $('#ac_clr').click(() => {
    $('#ac_data').val('')
    $('#ac_ti').focus()
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
  $('#lt_sc').click(() => {
    $('.lt-tab').hide()
    $('#lt_results').empty()
    $('#sc_tab').show()
    $('#sc_old').focus()
  })
}

$.when($.ready).then(function() {
  $.getJSON('/user/me')
  .then(r => {
    $.getJSON('/servicecentres/' + r.service_centre)
    .then(s => addPartsToDOM(s))
  })
})
