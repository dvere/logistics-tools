let ciMain = (data) => {

  let query = data.query
  query.fields = 'id,tracking_number,requested_route,consolidation_id,status,location'
  console.dir(query)
    
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

let filterProcessed = (json, query) => {
  query.fields = 'id,trunk_container.barcode'
  delete query.status
  
  $.getJSON('/consignments/', query).done(processedCons => {
    let ex = []
    processedCons.forEach(p => {
      if(p.trunk_container.length > 0) {
        ex.push(p.id)
      }
    })
    let unprocessedCons = json.filter(c => !ex.includes(c.id))
    ciOutput(unprocessedCons)
  })
}

let ciOutput = (cons) => {
  let out_html = $('<table>', {id: 'ci_results'}),
    results = [],
    fields = []

  if (cons.length > 0) {
    let head = $('<tr>', { class: 'ci-row ci-head' })

    $.each(Object.keys(cons[0]), (_i, k) => {
      head.append($('<td>').text(k))
      fields.push(k)
    })
    out_html.append(head)
    $.each(cons, (_i, o ) => {
      let row = $('<tr>', { class: 'ci-row' }),
        line = []
      $.each(o, (k, v) => {
        $('<td>', {class: 'ci-' + k}).text(v).appendTo(row)
        line.push(v)
      })
      out_html.append(row)
      results.push(line)
    })
  } else {
    out_html.append($('<tr>', { class: 'sc-row lt-error' })
      .html('<td>Query returned no results</td>'))
  }
  $('#lt_results').html(out_html)
  if (results.length) {
    results.unshift(fields)
    $('<div>', { class: 'download-link'})
      .text('Download these Results')
      .on('click', () => downloadCsv(results, 'ci_output'))
      .prependTo($('#lt_results'))
  }
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
    $('#lt_results').html($('<div>', { class: 'lt-error' })
      .text('Unable to build list of containers'))
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
            $('#'+ o.id +' ul.ac-list').append($('<li>', { class: 'sc-error' })
              .text(r + ' - ' + jqxhr.responseJSON.message))
            errors++
          } else {
            added++
          }
          $('#'+ o.id +' li.ac-summary')
            .text('Records Added: ' + added + ', Errors: '+ errors)
        })
      })
    })
  }
}

const downloadCsv = (data, fileName = 'download') => {
  out = []
  for (const i of data) {
    out.push(i.join(',') + '\n')
  }
  let a = document.createElement('a')
  let blob = new Blob(out, { type: 'text/csv' })
  a.href = window.URL.createObjectURL(blob)
  a.download = `${fileName}_${Date.now()}.csv`
  a.click()
  window.URL.revokeObjectURL(a.href)
}

const lpMain = async (data) => {
  $('#lt_results').html($('<div>',{ id: 'lp_results' })
  .append($('<div>', { id: 'lp_head', class: 'lp-row' })
    .append($('<div>').text('Barcode'))
    .append($('<div>').text('Route'))
    .append($('<div>').text('Stop Id'))))
  let csv = []
  for(const tn of data) {
    let j = await fetch('/consignment/scan/reconcile/' + tn).then(r => r.json())
    let row = $('<div>', { id: `tn_${tn}`, class: 'lp-row'})
    if(!j.id) {
      row.addClass('lp-error').text(`${tn} not manifested`)
      csv.push([tn, 0, 'Consignment Not Manifested'])
    } else if (!j.requested_route) {
      row.addClass('lp-error').text(`${tn} not routed`)
      csv.push([ tn, 0, 'Consignment Not Routed'])
    } else {
      row.append($('<div>').text(tn))
         .append($('<div>').text(j.requested_route))
         .append($('<div>').text(j.consolidation_id))
      csv.push([ tn, j.requested_route, j.consolidation_id ])
    }
    $('#lp_results').append(row)
  }
  csv.sort((a,b) => a[1] - b[1] || a[2].localeCompare(b[2]))
  csv.unshift(['Barcode', 'Route', 'Stop Id'])
  downloadCsv(csv, 'LabelPacks')
}

let scMain = (source, dest) => {
  $('#lt_results').html($('<div>',{ class: 'lt-loader' }))
  let data = {
    count: 5000,
    fields: 'tracking_number',
    q: 'trunk_container:' + source }
  $.getJSON('/consignments/', data)
  .done((cons) => {
    if (cons.length === 0) {
      $('#lt_results').html($('<div>', { class: 'lt-error' })
        .text('No records returned for ' + source))
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

let validateBarcodes = (arr, regex) => {
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

  $('<script>',{
    id: 'lt-bpc',
    src: lt + 'js/bpc.js'
  })
  .appendTo($('body'))

  let ciData = {}
  ciData.query = {
    q: 'collected:' + sc.code,
    count: 5000,
    client_id: 11270,
    location: sc.description
  }
  let ciOpts = [ 'RECEIVED', 'COLLECTED', 'ROUTED', 'RECONCILED' ]
  let scRegex = '(CAP)?(TRNK|CSTC|OOC)[0-9]{8}'
  let scAttr = { required: 'required',  pattern: scRegex, autocomplete: 'off' }

  let ltMenu = $('<div>', { id: 'lt_menu' })
  .append($('<button>', { id: 'lt_ci', class: 'lt-button', text: 'Consignments Inspector' }))
  .append($('<button>', { id: 'lt_ac', class: 'lt-button', text: 'Auto Containers' }))
  .append($('<button>', { id: 'lt_br', class: 'lt-button', text: 'Label Packs' }))
  .append($('<button>', { id: 'lt_sc', class: 'lt-button', text: 'Swap Containers' }))
  .append($('<button>', { id: 'lt_gp', class: 'lt-button', text: 'Print GP Containers', onClick:'getGroups()' }))

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
    .append($('<div>', { id: 'ci_form' })
      .append($('<input>', { id: 'sc_old', class: 'lt-input' }).attr(scAttr))
      .append($('<input>', { id: 'sc_new', class: 'lt-input' }).attr(scAttr))
      .append($('<button>', { id: 'sc_btn', class: 'lt-button' }).text('Move Records')))

  let ltClose = $('<span>', {id: 'lt_close' })
    .html("&#10006;")
    .click(() =>  $('#lt_container').remove())
  
  let ltContainer = $('<div>', { id: 'lt_container' })
    .append(ltMenu)
    .append($('<div>', { id: 'lt_insert' })
      .append(ciForm)
      .append(acForm)
      .append(lpForm)
      .append(scForm))
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
      $('#ac_data').val((_i, text) => text + $('#ac_ti').val() + '\n')
      $('#ac_data').scrollTop($('#ac_data')[0].scrollHeight)
      $('#ac_ti').select()
      return false
    }
  })

  $('#lp_ti').keypress((e) => {
    if (e.which == 13) {
      let audio = new Audio('/audio/success')
      audio.play()
      $('#lp_data').val((_i, text) => text + $('#lp_ti').val() + '\n')
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
  $('#lt_br').click(() => {
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
}

$.when($.ready).then(function() {
  $.getJSON('/user/me')
  .then(r => {
    $.getJSON('/servicecentres/' + r.service_centre)
    .then(s => addPartsToDOM(s))
  })
})
