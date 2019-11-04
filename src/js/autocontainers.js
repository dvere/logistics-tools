let dbName = 'containers'
let dbVersion = 1
let scanDb = {}
scanDb.db = null

scanDb.onerror = e => { // (?)
  console.log('DB Error: ' + e)
  alert('DB Error: ' + e)
}

scanDb.open = () => {
  let req = indexedDB.open(dbName, dbVersion)

  req.onsuccess = e => {
    scanDb.db = e.target.result
    scanDb.updateContainers()
  }

  req.onupgradeneeded = e => {
    scanDb.db = e.target.result
    if(scanDb.db.objectStoreNames.contains('trunk')) {
      scanDb.db.deleteObjectStore('trunk')
    }
    scanDb.db.createObjectStore('trunk', {keyPath: 'id'})
      .createIndex('barcode', 'barcode', {unique: true})
    scanDb.updateContainers()
  }

  req.onerror = e => {
    console.log('req error: ' + e)
  }
}
// retrieve trunk containers and put() into db
scanDb.updateContainers = () => {
  let data = {
    limit: 50,
    offset: 0,
    order: '-id',
    origin_service_centre: 'SW',
    status: 'all',
    type: 'all'
  }
  let u = '/trunkcontainers/'
  $.getJSON(u, data)
  .done((json) => {
    let os = scanDb.db.transaction('trunk', 'readwrite')
      .objectStore('trunk')
    $.each(json, (i, c) => {
      os.put(c)
    })
  })
}

/* cons - object, container - int id */
scanDb.containerAddCons = (cons, container) => {
  let os = scanDb.db.transaction('trunk', 'readwrite')
    .objectStore('trunk')
  let req = os.get(container)

  req.onsuccess = () => {
    let data = req.result
    data.consignments.push(cons)
    let addConsRequest = os.put(data)
    console.log('The transaction that originated this request is ' + addConsRequest.transaction)
  }
}
/* cons - string 'barcode' */
scanDb.getConsContainer = (cons) => {
  // of dubious utility and probably difficult
  
}
/* cons - string 'barcode', container - int id */

scanDb.removeCons = (cons, container) => {

}
/* container - int id */
/* returns array of consignment objects */
scanDb.listContainerCons = (container) => {

}

/* container - object */
scanDb.addContainer = (container) => {

}
/* container - int id */
scanDb.removeContainer = (container) => { 

}

/* IDB Code ends */


function processInput() {
  var input = parseInput()

}

function parseInput(){

  var rawInput = $('#aInput').val().toUpperCase().trim().split('\n')
  var barcodes = rawInput.slice(0)
  var currentContainer
  var inputContainers = []
  
  while((barcode = barcodes.shift()) !== undefined ) {

    if (barcode.match(/^PCS[0-9]{9}$/) === null) {

      if (inputContainers[barcode] === undefined) {

        inputContainers[barcode] = {
          id: Number(barcode.replace(/\D/g,'')),
          barcode: barcode,
          consignments: []
        }
      }
      currentContainer = barcode
    } else {
      currentConsignment = {
        barcode: barcode,
        timestamp: $.now()
      }
      inputContainers[currentContainer].consignments.push(currentConsignment)
    }
  }
  return inputContainers
}


function postConsignment(container, consignment) {
  var url = '/' + container.type + 'containers/' + container.barcode + '/scan/' + consignment
    fetch(url,{method: 'POST'})
}


function getContainer(id){
  $.getJSON('/trunkcontainers/' + id, (data) => {
    console.log(data)
  })
}

function autoContainers() {

  var aForm = $('<div>', {id: 'aForm'})
  .append($('<textarea>', {
    id:'aInput'
  }))
  .append($('<button>', {
    class: 'lt-button',
    text: 'Process'
  })
  .click(function() {
    processInput()
  }))
  .append($('<button>', {
    class: 'lt-button',
    text: 'Clear'
  })
  .click(function() {
    $('#aInput').val('')
  }))

  $('#ltInsert')
  .empty()
  .append(aForm)

  $('#aInput').focus()
}

$.when($.ready).then(function() {
	autoContainers();
})
