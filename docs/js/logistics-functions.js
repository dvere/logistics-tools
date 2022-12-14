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
      console.error('Ooops, CI GET Error: ' + s + '\n' + e)
      $('#lt_results').html($('<pre>').text(o))
    })
}

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

const acMain = (data) => {
  $('#lt_results').html($('<div>', { class: 'lt-loader' }))
  let containers = []
  var current
  $.each(data, (_i, bc) => {
    if (bc.match(/^PCS[0-9]{9}$/) === null) {
      let t = (bc.match(/^CSLC[0-9]{8}$/)) ? 'location' : 'trunk'
      containers.push({ id: bc, type: t, records: [] })
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
        let jqxhr = $.post('/' + o.type + 'containers/' + o.id + '/scan/' + r)
        jqxhr.always(() => {
          if (jqxhr.status !== 204) {
            $('#' + o.id + ' ul.ac-list').append($('<li>', { class: 'sc-error' })
              .text(r + ' - ' + jqxhr.responseJSON.message))
            errors++
          } else {
            added++
          }
          $('#' + o.id + ' li.ac-summary')
            .text('Records Added: ' + added + ', Errors: ' + errors)
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

const gpMain = () => {

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

const checkSSL = () => {
  if (location.protocol === 'https:') {
    return true
  }
  if (confirm( 
      'This script requires a secure connection in order to run\n\n' +
      'Click "OK" to reload this page using https, you can then re-run Logistics Tools\n\n' +  
      'Click "Cancel" to abort the creation and printing of GP containers and remain on this page'
  )) {
    location.assign(location.href.replace('http:','https:'))
  } else {
    throw 'Not using https, Print GP Containers aborted'
  }
}

const getClientLocations = async config => {
  const query = new URLSearchParams({
    limit: 10000,
    open: true,
    order: 'consolidation_id',
    service_centre: config.service_centre
  })
  const sites = await fetch('/client/11270/locations?' + query).then(r => r.json())
  const GPs = sites.filter(l => l.address_type === 'GP' && l.fixed == true)
  return GPs
}

const getLiveGroups = async (config) => {
  const url = `/route/current/depot/${config.service_centre}`
  const groups = await fetch(url).then(r=>r.json())
  return liveGroups
}

const filterGroups = (groups, future) => {
  let ug = [], filteredGroups
  for(const [key, group] of Object.entries(groups)) {
    const keyDate = Date.parse(key)
    const da = key.split('-')
    for(const [id, data] of Object.entries(group)) {
      const re = /^Capita /
      const notre = /Urgent/ 
      if(data.name.match(re) && !data.name.match(notre)) {
        const groupObject = {
          kd: keyDate,
          rgid: id,
          date: key,
          shortDate: da[2] +'-'+ da[1]
        }
        ug.push(groupObject)
      }
    }
  }
  
  filteredGroups = (future) ? ug.filter(g => g.kd > sunday) : ug.filter(g => g.kd < sunday)
  return filteredGroups
}

const getGroupRoutes = async group => {
  const search = new URLSearchParams({
    date: group.date,
    routeGroupId: group.rgid
  })
  const groupRoutes = await fetch('/routes/?' + search).then(r => r.json())
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

const genNewContainers = async route => {
  if(route.missing_containers.length) {
    const req = {
      body: JSON.stringify({
        route: route.key,
        open: true,
        consolidation_id: route.missing_containers.join(',')
      }),
      method: 'POST'
    }

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
  } else {
    return false
  }
}

const addPrintData = route => {
  const printData = []
  for(const c of route.newContainers) {
    const idx = route.locations.map(o => o.consolidation_id).indexOf(c.consolidation_id)
    const practice = route.locations[idx]
    printData.push({
      container_id: c.barcode,
      date: route.shortDate,
      practice_name: practice.name,
      postcode: practice.postcode,
      route: route.route_planned_code,
      to_ci: c.consolidation_id
    })
  }
  return printData
}

const printLabels = async groups => {
  for(let group of groups) {
    for(let route of group.routes) {
      if (route.printData) {
        let printBody = {
          url: 'https://labels.citysprint.co.uk/label/capita-location-container?printer=Swindon+Label+Printer+02',
          content: route.printData
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
        await fetch('/crossOrigin', printReq)
        await timer(2000)
      }
    }
  }
}

const retrieveData = async (groups, config) => {
  let locations = await getClientLocations(config)
  for (g of groups) {
    g.routes = await getGroupRoutes(g)
    for (r of g.routes) {
      r.shortDate = g.shortDate 
      r.locations = locations.filter(l => l.route_planned.code === r.route_planned_code)
      r.location_containers = await getOpenContainers(r)
      r.missing_containers = getMissingContainers(r)
    }
  }
  return groups
}

const fail = message => {
  $('#lt_results').html($('<h3>').text(`${message}`).css({color: 'red'}))
}

const win = message => {
  $('#lt_results').html($('<h3>').text(`${message}`).css({color: 'rgba(98,168,209,1)'}))
}
