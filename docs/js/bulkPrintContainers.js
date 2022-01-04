/* 
 *** WORK IN PROGRESS - NON FUNCTIONAL AS STAND ALONE SCRIPT! ***
 * Bulk create, sort and print logistics containers
 */  

if (window.location.protocol !== 'https:') {
  throw new Error('Connect with https to run this script')
}

const origin = window.location.origin
const date = new Date()
const today = date.getDay()
const params = {
    method: 'GET',
    mode: 'cors',
    credentials: 'include'
}

// local data - need to replace with dynamic api call!!!
const serviceCentre = 'SW'
const routeGroups = [ 
  {day:2, rgid: 410, routes: []},
  {day:3, rgid: 411, routes: []}, 
  {day:4, rgid: 412, routes: []}
]

const addGroupDate = group => {
  let o = group.day + 7 - today
  let d = new Date(date.valueOf() + (1000 * 60 * 60 * 24 * o))
  group.date = d.toJSON().substring(0,10)
}

const addShortDate = group => {
  let parts = group.date.split('-')
  group.sdate = parts[2] + '-' + parts[1] 
}

const getRouteKeys = async group => {
  const search = new URLSearchParams({
    date: group.date,
    routeGroupId: group.rgid
  })
  const url = origin + '/routes/?' + search.toString()
  const response = await fetch(url, params)
  const result = await response.json()
    
  result.forEach(route => {
    group.routes.push({
      key: route.key,
      rpc: route.route_planned_code
    })
  })
}

const getLocations = async routePlannedCode => {
  const search = new URLSearchParams({
    limit: 1000,
    open: true,
    order: 'consolidation_id',
    service_centre: serviceCentre,
    query: routePlannedCode
  })
  const url = origin + '/client/11270/locations?' + search.toString()
  const response = await fetch(url, params)
  const result = await response.json()
  const fixedLocations = result.filter(location => location.address_type === 'GP' && location.fixed == true)
  return fixedLocations
}

const printLabels = content => {
  let printBody = {
    url: 'https://labels.citysprint.co.uk/label/capita-location-container?printer=Swindon+Label+Printer+02',
    content: content
  }
  let printReq = {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    referrer: 'https://logistics.citysprint.co.uk/route/',
    body: JSON.stringify(printBody), 
    method: 'POST',
    mode: 'cors',
    credentials: 'include'
  }
  fetch('https://logistics.citysprint.co.uk/crossOrigin', printReq)
}

const addContainers = async (key, consolidation_id) => { 
  let url = origin + '/locationcontainers/'
  const body = {
    route: key,
    open: true,
    consolidation_id: consolidation_id
  }
  const params = {
    body: JSON.stringify(body),
    method: 'POST',
    mode: 'cors',
    credentials: 'include'
  }
  const response = await fetch(url, params)
  if (response.ok) {
    return Promise.resolve()
  } else {
    return Promise.reject(`Failed to create containers for ${key}`)
  }
}

const getPrintData = route => {
  let containers = route.containers
  let stops = route.consolidation_id
  let content = []
  for(i=0;i<containers.length;i++) {
    content.push({
      postcode: route.locations[i].postcode,
      route: route.locations[i].route_planned.code,
      date: route.sdate,
      to_ci: stops[i],
      container_id: containers[i],
      practice_name: route.locations[i].name
    })
  }
  return content
}

const getRouteData = async routeGroups => {
  let routes = []
  await routeGroups.forEach(async (group) => {
    addGroupDate(group)
    addShortDate(group)
    getRouteKeys(group)
    .then(() => {
      group.routes.forEach(async (route, x) => {
        let locations = await getLocations(route.rpc)
        let cid = []
        locations.forEach(location => {
          cid.push(location.consolidation_id)
        })
        group.routes[x].consolidation_id = cid
        group.routes[x].locations = locations
        group.routes[x].date = group.date
        group.routes[x].sdate = group.sdate
        routes.push(group.routes[x])
      })
    })
  })
  return routes
}

const sortByRoutePlannedCode = routes => {
    routes.sort((a,b) => (a.rpc > b.rpc)?1:-1)
    return routes
  }
  
const getRouteContainers = async routeKey => {
  const url = origin + '/routes/' + routeKey + '?fields=location_containers'
  const res = await fetch(url)
  const json = await res.json()
  return json.location_containers
}

const timer = ms => new Promise(res => setTimeout(res, ms))

const addContainersToRoute = async route => {
  let cid = route.consolidation_id.join(',')
  await addContainers(route.key, cid)  

  let c = await getRouteContainers(route.key)
  c.sort((a,b) => (a.consolidation_id > b.consolidation_id) ? 1: -1)
  containers = []
  for (x = 0; x < c.length; x++) {
    containers.push(c[x].barcode)
  }
  route.containers = containers
  route.printData = await getPrintData(route)
  return route
}

const sendToPrint = async routes => {
    for(i=0;i<routes.length;i++) {
        printLabels(routes[i].printData)
        await timer(2000)
    }
}

// doit
let routes = await getRouteData(routeGroups)

// break here!
routes.sort((a, b) => (a.rpc > b.rpc) ? 1 : -1)

// break here!
routes.forEach(r => addContainersToRoute(r))

// break here!
sendToPrint(routes)
