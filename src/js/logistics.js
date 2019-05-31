var url = '/consignments/'
var fields = [
  'tracking_number',
  'requested_route',
  'consolidation_id',
  'location',
  'delivery_address_type',
  'package_type',
  'status',
  'package_type'
]
var data = {
  q: 'collected:SW',
  count: 1000,
  client_id: 11270,
  fields: fields.join()
  }
const cStatus = [
  'RECEIVED SC',
  'COLLECTED',
  'ROUTED',
  'RECONCILED'
]
function showEvents(t, p) {
  var u = url + t + '/events'
  var cEvents = $('<div>', {'id': 'cEvents'})
  var cHeader = $('<div>', {class: 'events-header'})

  $.each(['Timestamp', 'SC', 'Event', 'User'], function(i, t) {
    $('<div>', {class: 'events-header-item', text: t}).appendTo(cHeader);
  })

  $('#cAudits').empty()
  $('#cAudits').append(cEvents)
  $('<h2>', {text: p}).appendTo(cEvents)
  $('#cEvents').append(cHeader)
  
  $.getJSON(u, function(json) {
    $.each(json, function(i, obj) {
      var cEvent = $('<div>', {class: 'event'})
      obj.service_centre = obj.service_centre || {code: 'NA'}
      obj.user = obj.user || {username: 'NA'}
      $('<div>', {'class': 'event-item', 'text': obj.timestamp}).appendTo(cEvent)
      $('<div>', {'class': 'event-item', 'text': obj.service_centre.code}).appendTo(cEvent)
      $('<div>', {'class': 'event-item', 'text': obj.tracking_code.code}).appendTo(cEvent)
      $('<div>', {'class': 'event-item', 'text': obj.user.username}).appendTo(cEvent)
      cEvent.appendTo(cEvents)
    });
    $('#cAudits').fadeIn()
  })
    .fail(function() {
      console.log('Events Request Failed')
  });
}

function getCollectedCons() {

  data.received_at = $('#cDate').val()
  data.status = $('#cStatus').val()
  data.location = 'SWINDON'

  $('#cConsignments').remove()

  $.getJSON(url, data, function(json) {
    if (json.length > 0) {

      var cHeader = $('<thead>', {class: 'consignments-header'})
      var cTable = $('<table>', {'id': 'cConsignments'})
      .append(cHeader)

      $.each(['Tracking No', 'Type', 'Route', 'Cons. Id' ,'Location', 'Status'], function(i, t) {
        $('<th>', {class: 'consignments-header-item', text: t}).appendTo(cHeader)
      })

      $('#cInsert').append(cTable)
      .append($('<div>', {'id': 'cAudits'}))

      $('#cAudits').click(function() {
        $(this).fadeOut()
      })

      $.each(json, function(i, obj) {
        var cConsignment = $('<tr>', {class: 'consignment'})
        $('<td>', {
          'class': 'consignment-item',
          'text': obj.tracking_number,
          'onclick': 'showEvents(' + obj.id + ',"' + obj.tracking_number + '")',
          'id': obj.id}).appendTo(cConsignment)
        $('<td>', {'class': 'consignment-item', 'text': obj.package_type}).appendTo(cConsignment)
        $('<td>', {'class': 'consignment-item', 'text': obj.requested_route}).appendTo(cConsignment)
        $('<td>', {'class': 'consignment-item', 'text': obj.consolidation_id}).appendTo(cConsignment)
        $('<td>', {'class': 'consignment-item', 'text': obj.location}).appendTo(cConsignment)
        $('<td>', {'class': 'consignment-item', 'text': obj.status}).appendTo(cConsignment)
        $('#cConsignments').append(cConsignment)
      })
    } else {
      $('#cInsert').append($('<div>', {id: 'cConsignments', text: 'Lookup returned no consignments.'}))
    }
  })
  .fail(function() {
    console.log('Consignments Request Failed')
  })
}

function addPartsToDOM() {
  $('<link>', {rel: 'stylesheet', href: 'https://dvere.github.io/cons-inspector/css/logistics.min.css?v=' + $.now()})
    .appendTo($('head'))

  $('#cInsert').remove()
  var cSelect = $('<select>', {id: 'cStatus'})
  $.each(cStatus, function(i, v) {
    $('<option>', {value: v, text: v})
    .appendTo(cSelect)
  })
  var cForm = $('<div>', {'id': 'cForm'})
    .append($('<input>', {'id':'cDate', 'type':'date'}))
    .append(cSelect)
    .append($('<button>', {'id': 'cButton', 'text': 'Look up collections', 'onclick': 'getCollectedCons()'}))
  var cInsert = $('<div>', {'id': 'cInsert'})
    .append(cForm)

    $('#main-container > div > div.page-content > div > div').empty().append(cInsert)
}

$.when($.ready).then(function() {
	addPartsToDOM();
})
