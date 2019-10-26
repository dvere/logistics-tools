function addPartsToDOM(){
  if (!$('#lt-style').length) {
    $('<link>', {
      id: 'lt-style',
      rel: 'stylesheet',
      href: 'https://dvere.github.io/logistics-tools/css/logistics-tools.min.css?v=' + $.now()
    })
    .appendTo($('head'))
  }
  
  var ltContainer = $('<div>', {
    id: 'ltContainer'
  })
  .append($('<button>', {
    id: 'ltButton1',
    class: 'ltButton',
    text: 'Consignments Inspector',
    onclick: 'goCI()'
  }))
  .append($('<button>', {
    id: 'ltButton2',
    class: 'ltButton',
    text: 'Auto Containers',
    onclick: 'goAC()'
  }))
  .append($('<div>', {
    id: 'ltInsert'
  }))

  $('div.breadcrumbs').hide()
  $('div.page-content > div > div')
  .empty()
  .append(ltContainer)

  $('<script>', {id: 'ltChild'})
  .appendTo($('body'))
}
function goCI() {
  $('#ltChild').attr({src: 'https://dvere.github.io/logistics-tools/js/consinspect.min.js?v=' + $.now()})
}
function goAC() {
  $('#ltChild').attr({src: 'https://dvere.github.io/logistics-tools/js/autocontainers.min.js?v=' + $.now()})
}

$.when($.ready).then(function() {
  addPartsToDOM();
})