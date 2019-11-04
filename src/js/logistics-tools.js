import sc from 'https://dvere.github.io/logistics-tools/js/switchcontainers.min.js'

function addPartsToDOM(){

  var lt = 'https://dvere.github.io/logistics-tools/'

  $('<link>', {
    id: 'lt-style',
    rel: 'stylesheet',
    href: lt + 'css/logistics-tools.min.css?v=' + $.now()
  })
  .appendTo($('head'))

  // $('body')
  // .append($('<script>', {
  //   id: 'lt-ci',
  //   src: lt + 'js/consinspect.min.js?v=' + $.now()
  // }))
  // .append($('<script>', {
  //   id: 'lt-ac',
  //   src: lt + 'js/autocontainers.min.js?v=' + $.now()
  // }))
  // .append($('<script>', {
  //   id: 'lt-sc',
  //   src: 'js/switchcontainers.min.js?v=' + $.now()
  // }))

  var ltContainer = $('<div>', {
    id: 'ltContainer'
  })
  // .append($('<button>', {
  //   class: 'ltButton',
  //   onclick: consInspector,
  //   text: 'Consignments Inspector'
  // }))
  // .append($('<button>', {
  //   class: 'ltButton',
  //   onclick: autoContainers,
  //   text: 'Auto Containers'
  // }))
  .append($('<button>', {
    class: 'ltButton',
    onclick: sc.prepare,
    text: 'Swap Containers'
  }))
  .append($('<div>', {id: 'ltInsert'}))

  $('div.breadcrumbs').hide()
  $('div.page-content > div > div')
  .empty()
  .append(ltContainer)
}

$.when($.ready).then(function() {
  addPartsToDOM();
})
