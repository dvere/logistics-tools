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
  'RECONCILED',
  'DELIVERED'
]
function showEvents(t){
  var u = url + t + '/events'
  var cEvents = $('<div>', {'id': 'cEvents'})
  var cHeader = $('<div>',{class: 'events-header'})

  $.each(['Timestamp', 'SC','Event','User'], function(i, t){
    $('<div>',{class: 'events-header-item', text: t}).appendTo(cHeader);
  })
  
  $('#cAudits').empty()
  $('#cAudits').append(cEvents)
  $('#cEvents').append(cHeader)
  
  $.getJSON(u,function(json){
    $.each(json, function(i, obj) {
      var cEvent = $('<div>',{class: 'event'})
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
    .fail(function(){
      console.log('Events Request Failed')
  });
}

function getCollectedCons() {
  var cHeader = $('<div>',{class: 'consignments-header'})

  $.each(['Traking No','Type','Route','Cons. Id','Location','Status'], function(i, t){
    $('<div>',{class: 'consignments-header-item', text: t}).appendTo(cHeader)
  })

  $('#cConsignments').empty()
  $('#cConsignments').append(cHeader)

  data.received_at = $('#cDate').val()

  $.getJSON(url, data, function(json){
    $.each(json, function(i, obj) {
      if(obj.location === 'SWINDON' && obj.status === $('#cStatus').val()) {
        var cConsignment = $('<div>', {class: 'consignment'})
        $('<div>', {'class': 'consignment-item', 'text': obj.tracking_number, 'onclick': 'showEvents(' + obj.id + ')', 'id': obj.id})
          .appendTo(cConsignment)
        $('<div>', {'class': 'consignment-item', 'text': obj.package_type}).appendTo(cConsignment)
        $('<div>', {'class': 'consignment-item', 'text': obj.requested_route}).appendTo(cConsignment)
        $('<div>', {'class': 'consignment-item', 'text': obj.consolidation_id}).appendTo(cConsignment)
        $('<div>', {'class': 'consignment-item', 'text': obj.location}).appendTo(cConsignment)
        $('<div>', {'class': 'consignment-item', 'text': obj.status}).appendTo(cConsignment)
        $('#cConsignments').append(cConsignment)
      }
    })
  })
    .fail(function(){
      console.log('Consignments Request Failed')
  })
}

function addPartsToDOM(){
  $('<link>', {rel: 'stylesheet', href: 'https://dvere.github.io/cons-inspector/css/logistics.min.css?v='+ $.now()})
    .appendTo($('head'))
  $('div.page-content').remove()
  $('#cInsert').remove()
  var cSelect = $('<select>',{id: 'cStatus', name: 'status'})
  cStatus.each(function(v){
    $('<option>',{value: v, text: v})
    .appendTo(cSelect)
  })
  var cForm = $('<div>',{'id': 'cForm'})
    .append($('<input>', {'id':'cDate', 'type':'date'}))
    .append(cSelect)
    .append($('<button>', {'id': 'cButton', 'text': 'Lookup Collections', 'onclick': 'getCollectedCons()'}))
  var cInsert = $('<div>',{'id':'cInsert'})
    .append(cForm)
    .append($('<div>', {'id': 'cConsignments'}))
    .append($('<div>', {'id':'cAudits'}))
  $('#breadcrumbs').after(cInsert)

	$('#cAudits').click(function(){
    $(this).fadeOut()
  })
}

$.when($.ready).then(function() {
	addPartsToDOM();
})
