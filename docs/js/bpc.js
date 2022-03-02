if (window.location.protocol !== 'https:') {
  throw new Error('Connect with https to run this script')
}
const date = new Date()
const today = [
  date.getFullYear(),
  String(date.getMonth()+1).padStart(2,'0'),
  String(date.getDate()).padStart(2,'0')].join('-')
const d = date
d.setDate(d.getDate() + ((7 - d.getDay()) % 7 + 1) % 7)
const timer = ms => new Promise(res => setTimeout(res, ms))
const baseUrl = window.location.origin
const params = {
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
}
let config = {}
let groups = []

const getGroups = async (groupDate = today) => {
  fetch(baseUrl + '/user/me', params)
  .then(res => res.json())
  .then(json => {
    const sc = config.sc = json.service_centre
    config.printer = json.consignment_printer_name
    // insert logic for selecting routes by route/date here
    const url = baseUrl +'/route/current/depot/'+ sc +'/date/' + groupDate
    return fetch(url, params)
  })
  .then(res => res.json())
  .then(json => {
    for(const [key, gid] of Object.entries(json)) {
      // filter groups.. temp default is to only return groups with date after Next Monday (present if day = 0) 
      if(Date.parse(key) > d) {
        const da = key.split('-')
        for(const [id, data] of Object.entries(gid)) {
          const re = /^Capita /
          const notre = /Urgent/ 
          if(data.name.match(re) && !data.name.match(notre)) {
            const group = {
              rgid: id,
              date: key,
              shortDate: da[2] +'-'+ da[1],
              routes: []
            }
            groups.push(group)
          }
        }
      }
    }
    return groups
  })
  .then(async groups => {
    for(const group of groups) {
      const search = new URLSearchParams({
        date: group.date,
        routeGroupId: group.rgid
      })
      const url = baseUrl + '/routes/?' + search.toString()
      const response = await fetch(url, params)
      const result = await response.json()
      result.forEach(async route => {
        const search = new URLSearchParams({
          limit: 1000,
          open: true,
          order: 'consolidation_id',
          service_centre: config.sc,
          query: route.route_planned_code
        })
        const query = search.toString()
        const url = baseUrl + '/client/11270/locations?' + query
        const response = await fetch(url, params)
        const result = await response.json()
        const locations = result.filter(location => location.address_type === 'GP' && location.fixed == true)
        group.routes.push({
          key: route.key,
          rpc: route.route_planned_code,
          locations: locations
        })
      }) 
    }
    return groups
  })
  .then(async groups => {
    for(let group of groups) {
      for(let route of group.routes) {
        const url = baseUrl +'/routes/'+ route.key +'?fields=location_containers'
        const res = await fetch(url, params)
        const data = await res.json()
        // XXX DELETE to EOF to NOT create containers
        // if no containers..generate and add them to data.location_containers
        if(!data.location_containers.length) {
          const cid = []
          for(const l of route.locations) {
            cid.push(l.consolidation_id)
          }
          const body = {
            route: route.key,
            open: true,
            consolidation_id: cid.join(',')
          }   
          let request = await fetch(baseUrl + '/locationcontainers/', {
            body: JSON.stringify(body),
            method: 'POST',
            mode: 'cors',
            credentials: 'include'
          })
          let results = await request.json()
          const rbarcodes = results.barcode.split(',')
          const rcids = results.consolidationId.split(',')
          for(i=0;i<rbarcodes.length;i++) {
            data.location_containers.push({
              barcode: rbarcodes[i],
              consolidation_id: rcids[i]
            })
          }
        } // XXX EOF <<
        data.location_containers.sort((a, b) => (a.consolidation_id > b.consolidation_id)? 1: -1)
        route.containers = data.location_containers
      }
    }
    return groups
  })
  .then(groups => {
    groups.sort((a,b) => (a.date > b.date)? 1: -1)
    for(let group of groups) {
      group.routes.sort((a,b) => (parseInt(a.rpc) > parseInt(b.rpc))? 1: -1)
    }
    return groups
  }) 
  .then(groups => {
    for(let group of groups) {
      for(let route of group.routes) {
        route.printData = []
        for(const c of route.containers) {
          const idx = route.locations.map(o => o.consolidation_id).indexOf(c.consolidation_id)
          const practice = route.locations[idx]
          route.printData.push({
            container_id: c.barcode,
            date: group.shortDate,
            practice_name: practice.name,
            postcode: practice.postcode,
            route: route.rpc,
            to_ci: c.consolidation_id
          })
        }
      }
    }
    return groups
  })
  // XXX DELETE to EOF to suppress printing
  .then(async groups => {
    for(let group of groups) {
      for(let route of group.routes) {
        let printBody = {
          url: 'https://labels.citysprint.co.uk/label/capita-location-container?printer=Swindon+Label+Printer+02',
          content: route.printData
        }
        let printReq = {
          headers: {
            'Content-Type': 'application/json;charset=UTF-8'
          },
          referrer: baseUrl + '/route/',
          body: JSON.stringify(printBody), 
          method: 'POST',
          mode: 'cors',
          credentials: 'include'
        }
        await fetch(baseUrl + '/crossOrigin', printReq)
        await timer(2000)
      }
    }
  }) // XXX EOF <<
}
