const date = new Date()
const today = date.toJSON().substring(0,10)
const ddiff = (date.getDate() - date.getDay() + 1) + 6
const sunday = new Date(date.setDate(ddiff))
const config = await fetch('/user/me').then(r=>r.json())
const sorter = (a,b) => (a.consolidation_id > b.consolidation_id) ? 1 : -1
const timer = ms => new Promise(res => setTimeout(res, ms))

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

const getLiveGroups = async (groupDate = today) => {
  const url = `/route/current/depot/${config.service_centre}/date/${groupDate}`
  const groups = await fetch(url).then(r=>r.json())
  const liveGroups = filterGroups(groups)
  return liveGroups
}

const filterGroups = groups => {
  let filteredGroups = []
  for(const [key, group] of Object.entries(groups)) {
    const keyDate = Date.parse(key) 
    if(keyDate < sunday) {
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
  }
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

const retrieveData = async () => {
  let groups = await getLiveGroups()
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

const bulkCreateContainers = async () => {
  try {
    checkSSL()
  } catch (e) {
    console.error(e)
    alert(e)
    return
  }
  
  $('#lt_results').html($('<div>',{ class: 'lt-loader' }))
  
  const groups = await retrieveData()

  if(!groups) {
    fail('No live groups to print labels for')
    return
  }
  
  const messageArray = []
  for (const g of groups) {
    let groupObject = {
      date: g.date,
      routes: g.routes.length,
      containers: 0
    }
    
    for (const r of g.routes) {
      groupObject.containers += r.missing_containers.length
    }

    messageArray.push(groupObject)
  }
  let promptMessage = 'Generate Containers as below?\n\n'
  for(;messageArray.length>0;) {
    m = messageArray.shift()
    row = ''
    for ([k,v] of Object.entries(m)) {
      row += `${k}: ${v} `
    }
    promptMessage += `${row.trim()}\n`
  }
  
  if(!confirm(promptMessage)) {
    fail('Container generation canceled')
    return
  }

  for(g of groups) {
    for(r of g.routes) {
      console.log(g.rgid, r.route_planned_code, r.missing_containers.length, r.missing_containers)
      r.newContainers = await genNewContainers(r)
      r.printData = addPrintData(r)
    }
  }
  
  if(!confirm('Print new container labels')) {
    fail('Container labels created but not printed')
    return
  }
  
  await printLabels(groups)
  win('Container labels sent to printer')

}
