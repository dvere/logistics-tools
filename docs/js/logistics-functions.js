// XXX TODO - convert to simple fetch
const ciMain = (data) => {
  let query = data.query
  query.fields = 'id,tracking_number,requested_route,consolidation_id,status,location'
  console.dir(query)

  $('#lt_results').html($('<div>', { class: 'lt-loader' }))

  $.getJSON('/consignments/', query).done((json) => {
    if (data.ncr === 1) {
      filterProcessed(json, query)
    } else {
      ciOutput(json)
    }
  })
    .fail((o, s, e) => {
      console.error(`Ooops, CI GET Error: ${s}\n${e}`)
      $('#lt_results').html($('<pre>').text(o))
    })
}

// XXX TODO - convert to simple fetch
const filterProcessed = (json, query) => {
  query.fields = 'id,trunk_container.barcode'
  delete query.status

  $.getJSON('/consignments/', query).done(processedCons => {
    let ex = []
    processedCons.forEach(p => {
      if (p.trunk_container.length > 0) {
        ex.push(p.id)
      }
    })
    let unprocessedCons = json.filter(c => !ex.includes(c.id))
    ciOutput(unprocessedCons)
  })
}

const ciOutput = (cons) => {
  let out_html = $('<table>', { id: 'ci_results' }),
    results = [],
    fields = []

  if (cons.length > 0) {
    let head = $('<tr>', { class: 'ci-row ci-head' })
    $.each(Object.keys(cons[0]), (_i, k) => {
      head.append($('<td>').text(k))
      fields.push(k)
    })
    out_html.append(head)
    $.each(cons, (_i, o) => {
      let row = $('<tr>', { class: 'ci-row' }),
        line = []
      $.each(o, (k, v) => {
        $('<td>', { class: 'ci-' + k }).text(v).appendTo(row)
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
    $('<div>', { class: 'download-link' })
      .text('Download these Results')
      .on('click', () => downloadCsv(results, 'ci_output'))
      .prependTo($('#lt_results'))
  }
}

const acMain = async (data) => {
  $('#lt_results').html($('<div>', { class: 'lt-loader' }))
  let containers = []
  var current
  for(const bc of data) {
    if (bc.match(/^PCS[0-9]{9}$/) === null) {
      let t = (bc.match(/^CSLC[0-9]{8}$/)) ? 'location' : 'trunk'
      containers.push({ id: bc, type: t, records: [] })
      current = bc
    } else {
      let idx = containers.findIndex(e => e.id === current)
      containers[idx].records.push(bc)
    }
  }
  if (containers.length === 0) {
    $('#lt_results').html($('<div>', { class: 'lt-error' })
      .text('Unable to build list of containers'))
  } else {
    $('#lt_results').html($('<div>', { id: 'ac_results' }))
    for(const o of containers) {
      let row = $('<div>', { id: o.id, class: 'ac-row' })
        .append($('<div>', { class: 'ac-col-l' }).text(o.id))
        .append($('<div>', { class: 'ac-col-r' })
          .append($('<ul>', { class: 'ac-list' })
            .append($('<li>', { class: 'ac-summary' }))))

      $('#ac_results').append(row)

      let errors = 0
      let added = 0
      for(const r of o.records) {
        let scanUri = `/${o.type}containers/${o.id}/scan/${r}`
        await fetch(scanUri, { method: 'POST'})
        .then(res => { 
          if (res.status !== 204) {
            errors++
            return res.json()
          } else {
            added++
            return false
          }
        })
        .then(result => {
          $('#' + o.id + ' li.ac-summary')
              .text('Records Added: ' + added + ', Errors: ' + errors)
          if(result) {
            $('#' + o.id + ' ul.ac-list').append($('<li>', { class: 'sc-error' })
              .text(r + ' - ' + result.message))
          }
        })
      }
    }
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
  $('#lt_results').html($('<div>', { id: 'lp_results' })
    .append($('<div>', { id: 'lp_head', class: 'lp-row' })
      .append($('<div>').text('Barcode'))
      .append($('<div>').text('Route'))
      .append($('<div>').text('Stop Id'))))
  let csv = []
  for (const tn of data) {
    let j = await fetch('/consignment/scan/reconcile/' + tn).then(r => r.json())
    let row = $('<div>', { id: `tn_${tn}`, class: 'lp-row' })
    if (!j.id) {
      row.addClass('lp-error').text(`${tn} not manifested`)
      csv.push([tn, 0, 'Consignment Not Manifested'])
    } else if (!j.requested_route) {
      row.addClass('lp-error').text(`${tn} not routed`)
      csv.push([tn, 0, 'Consignment Not Routed'])
    } else {
      row.append($('<div>').text(tn))
        .append($('<div>').text(j.requested_route))
        .append($('<div>').text(j.consolidation_id))
      csv.push([tn, j.requested_route, j.consolidation_id])
    }
    $('#lp_results').append(row)
  }
  csv.sort((a, b) => a[1] - b[1] || a[2].localeCompare(b[2]))
  csv.unshift(['Barcode', 'Route', 'Stop Id'])
  downloadCsv(csv, 'LabelPacks')
}

// XXX TODO - convert to simple fetch
const scMain = (source, dest) => {
  $('#lt_results').html($('<div>', { class: 'lt-loader' }))
  let data = {
    count: 5000,
    fields: 'tracking_number',
    q: 'trunk_container:' + source
  }
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

const validateBarcodes = (arr, regex) => {
  let count = 0
  $.each(arr, (_i, bc) => {
    if (bc.match(regex) === null) {
      count++
    }
  })
  if (count > 0) return false
  return true
}

// BPC
const date = new Date()
const today = date.toJSON().substring(0,10)
const sorter = (a,b) => (a.consolidation_id > b.consolidation_id) ? 1 : -1
const timer = ms => new Promise(res => setTimeout(res, ms))

const getClientLocations = async config => {
  const query = new URLSearchParams({
    limit: 10000,
    open: true,
    order: 'consolidation_id',
    service_centre: config.service_centre
  })
  const sites = await fetch('/client/11270/locations?' + query).then(r => r.json())
  const GPs = sites.filter(l => l.address_type === 'GP' && l.fixed === true)
  return GPs
}

const getLiveGroups = async (config) => {
  const url = `/route/current/depot/${config.service_centre}`
  const groups = await fetch(url).then(r=>r.json())
  return filterGroups(groups)
}

const filterGroups = groups => {
  let filteredGroups = []
  for(const [key, group] of Object.entries(groups)) {
    const da = key.split('-')
    for(const [id, data] of Object.entries(group)) {
      const re = /^Capita /
      const notre = /Urgent/ 
      if(data.name.match(re) && !data.name.match(notre)) {
        const groupObject = {
          rgid: id,
          date: key,
          shortDate: da[2] +'-'+ da[1]
        }
        filteredGroups.push(groupObject)
      }
    }
  }
  return filteredGroups
}

const getGroupRoutes = async group => {
  const search = new URLSearchParams({
    date: group.date,
    routeGroupId: group.rgid
  })
  const groupRoutes = await fetch('/routes/?' + search).then(r => r.json())
  for( let r of groupRoutes ) r.shortDate = group.shortDate
  return groupRoutes
}

const getOpenContainers = async route => {
  const query = new URLSearchParams({fields: 'location_containers'})
  const location_containers = await fetch(`/routes/${route.key}?${query}`)
    .then(r => r.json())
    .then(j => j.location_containers.sort(sorter))
  return location_containers
}

const getMissingContainers = route => {
  const rl = route.locations
  const rc = route.location_containers
  const missing_containers = []
  
  for(m of rl.filter(l => !rc.some(c => l.consolidation_id === c.consolidation_id))) {
    missing_containers.push(m.consolidation_id)
  }
  return missing_containers
}

const getRoutes = async (config) => {
  const locations = await getClientLocations(config)
  let groups = await getLiveGroups(config)
  const allRoutes = []
  for (let g of groups) {
    g.routes = await getGroupRoutes(g)
    for (r of g.routes) {
      r.shortDate = g.shortDate 
      r.locations = locations.filter(l => l.route_planned.code === r.route_planned_code)
      r.location_containers = await getOpenContainers(r)
      r.missing_containers = getMissingContainers(r)
      allRoutes.push(r)
    }
  }
  
  allRoutes.sort((a,b) => ((a.date + a.route_planned_code) > (b.date + b.route_planned_code))? 1: -1)
  const routes = allRoutes.filter(e => e.missing_containers.length > 0)
  return routes
}

const genNewContainers = async req => {
  const newContainers = await fetch('/locationcontainers/', req)
    .then(r => r.json())
    .then(j => {
      data = []
      const b = j.barcode.split(',')
      const c = j.consolidationId.split(',')
      for(;b.length > 0;) {
        data.push({
          barcode: b.shift(),
          consolidation_id: c.shift()
        })
      }
      return data
    })
  return newContainers
}

const addBarcodes = async route => {
  $(`#${route.key}`).text('Creating containers...')
  let s = route.containers.map(x => x.to_ci)
  const req = {
    body: JSON.stringify({
      route: route.key,
      open: true,
      consolidation_id: s.join(',')
    }),
    method: 'POST'
  }
  const nbc = await genNewContainers(req)
  for (c of nbc) {
    const idx = route.containers.map(o => o.to_ci).indexOf(c.consolidation_id)
    route.containers[idx].container_id = nbc[idx].barcode
  }
}

const printLabels = async (data, config) => {
  let printer = config.container_printer_name
  if(config.local_printing) {
    printer = config.container_local_printer_name
  }
  let query = new URLSearchParams({printer: printer})
  let printBody = {
    url: 'https://labels.citysprint.co.uk/label/capita-location-container?' + query,
    content: data
  }
  let printReq = {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    referrer: location.origin + '/route/',
    body: JSON.stringify(printBody),
    method: 'POST',
    mode: 'cors',
    credentials: 'include'
  } 
  const response = await fetch('/crossOrigin', printReq)
  return response
}

const getData = async config => {
  const routes = await getRoutes(config)
  const nc = []

  for (r of routes) {
    const rData = {
      date: r.date,
      key: r.key,
      rpc: r.route_planned_code,
      containers: []
    }
    for(c of r.missing_containers) {
      const idx = r.locations.map(o => o.consolidation_id).indexOf(c)
      const practice = r.locations[idx]
      let data = {
        date: r.shortDate,
        to_ci: c,
        practice_name: practice.name,
        postcode: practice.postcode,
        route: r.route_planned_code
      }
      rData.containers.push(data)
    }
    nc.push(rData)
  }
  return nc
}
const gpMain = async (data, config) => {
  for(const r of data) {
    await addBarcodes(r)
    console.log(r)
    let response = await printLabels(r.containers, config)
    if(response.ok) {
      $(`#${r.key}`).text('Labels sent to print')
    } else {
      $(`#${r.key}`).text(`Print failed: ${response.statusText}`)
    }
    await timer(2000)
  }
}

const populateGPs = async config => {
  const groups = {}
  const gpGroups = []
  $('#gp_form').remove()
  $('#gp_tab').append($('<div>', { id: 'gp_tmp', class: 'lt-loader' }))
  
  const routes = await getData(config)
 
  if(!routes) {
    $('#gp_tmp').remove()
    $('#lt_results').append($('<h3>', { text: 'No live routes found', class: 'gp-error' }))
    return
  }
  
  for (const r of routes) {
    if(groups[r.date]) {
      groups[r.date].push(r)
    } else {
      groups[r.date] = [r]
    }
  }

  for(const [date, rArray] of Object.entries(groups)) {
    let gpGroup = $('<div>', {class: 'gp-group', id: date})
  
    for (const r of rArray) { 
      gpGroup.append($('<div>', { class: 'gp-row'})
        .append($('<input>', { type: 'checkbox', class: 'gp-cbx' })
          .data('route', r))
        .append($('<label>', { text: `${r.rpc} - ${r.containers.length} containers`, class: 'gp-lbl'}))
        .append($('<span>', { id: r.key, class: 'gp-res' })))
    }
    gpGroup.prepend($('<div>', { class: 'gp-route'})
      .append($('<input>',{ type: 'checkbox', class: 'gp-cbx' })
        .change(function() {
          $('div.gp-row > input[type=checkbox]', gpGroup)
            .prop('checked', $(this).prop('checked'))
        })
      )
      .append($('<label>', { class: 'gp-lbl'})
        .append($('<span>', { text: date }))
        .append($('<i>', { class: 'ace-icon fa fa-caret-down'}))
        .click(() => $('.gp-row', gpGroup).toggle()))
    )
    gpGroups.push(gpGroup)
  }

  if (gpGroups.length) {
    let gpForm = $('<div>', { id: 'gp_form' })
      .append($('<div>', { id: 'gp_select'})
        .append(gpGroups))
      .append($('<button>', { class: 'lt-button', id: 'gp_all', text: 'Toggle All' })
        .click(() => {
          $('input.gp-cbx').each((_,e) => $(e).prop('checked', !$(e).prop('checked')))
        }))
      .append($('<button>', { class: 'lt-button', id: 'gp_btn', text: 'Print Selected' })
        .click(() => {
          let gpData = []
          $('.gp-row > .gp-cbx:checked').each((i, e) => {
            gpData.push($(e).data('route'))
          })
          gpMain(gpData, config)
        }))
    $('#gp_tmp').replaceWith(gpForm)
  } else {
    $('#gp_tmp').remove()
    $('#lt_results').append($('<h3>', { text: 'No routes require containers', class: 'gp-error' }))
  }
}
