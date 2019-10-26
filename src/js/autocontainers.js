// https://logistics.citysprint.co.uk/locationcontainers/CSLC01090115/scan/PCS027509694

const url = 'https://logistics.citysprint.co.uk/'
const aContainerTypes = {'Trunk': 'trunkcontainers','Location':'locationcontainers'}

/*
 * url samples
 * https://logistics.citysprint.co.uk/trunkcontainers/CSTC00192236/scan/PCS027509694
 * https://logistics.citysprint.co.uk/locationcontainers/CSLC01090115/scan/PCS027509694
 * 
 * Responses
 * trunk:
 * 204 good
 * 500 error
 * 
 * location:
 * 204 good
 * 400 error - check response json
 * 
 */

function processContainers() {
  // the heavy lifting
  alert('processContainers()')
}

function postConsignment(consignment, container) {
  // xhr / fetch cons to containers
}

function parseResopnse(consignment, response) {
  // check result
}

function addContainer(container, consignents, type) {
  // add container to loacal storage or idb
}

function updateContainer(container, consignment, result) {
  // update stored container.consignment with consignment xhr result 
}

function getContainer(container) {
  // retrieve stored container
}

function getResults(container) {
  // retrieve results from containers
}

function showResults(containers) {
  // assemble results to display
}

function resolveErrors() {
  // remove error cons from containers
}




function autoContainers() {

  var aSelect = $('<select>', {id: 'aType'})

  $.each(aContainerTypes, function(k, v) {
    $('<option>', {
      value: v,
      text: k
    })
    .appendTo(aSelect)
  })

  var aForm = $('<div>', {'id': 'aForm'})
  .append($('<textarea>', {
    'id':'aInput'
  }))
  .append(aSelect)
  .append($('<button>', {
    'id': 'aButton',
    'text': 'Process',
    'onclick': 'processContainers()'
  }))
  $('#ltInsert')
  .empty()
  .append(aForm)
}

$.when($.ready).then(function() {
	autoContainers();
})
