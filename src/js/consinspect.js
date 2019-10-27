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
var cStatus = [
  'RECEIVED SC',
  'COLLECTED',
  'ROUTED',
  'RECONCILED'
]

function consDetails(id) {
	window.open('/route/#/consignments/' + id + '/details')
}

function showEvents(t, p) {
  var u = url + t + '/events'
  var cEvents = $('<div>', {id: 'cEvents'})
  var eTitle = $('<h2>',
    {
      'class': 'dlink',
      'text': p
    })
    .click(function() {
      consDetails(t)
    })

  var eTable = $('<table>', {id: 'eTable'})
  var eHeader = $('<thead>', {class: 'events-header'})

  $('#ltInsert').append($('<div>', {id: 'cAudits'}))

  $.each(['Timestamp', 'SC', 'Event', 'User'], function(i, v) {
    $('<th>', {class: 'events-header-item', text: v}).appendTo(eHeader);
  })

  eTable.append(eHeader)
  cEvents.append(eTitle)
    .append(eTable)

  $('#cAudits')
    .append(cEvents)

  $.getJSON(u, function(json) {
    $.each(json, function(i, obj) {
      var cEvent = $('<tr>', {class: 'event'})
      obj.service_centre = obj.service_centre || {code: 'NA'}
      obj.user = obj.user || {username: 'NA'}

      $('<td>', {
        class: 'event-item',
        text: obj.timestamp
      })
      .appendTo(cEvent)

      $('<td>', {
        class: 'event-item',
        text: obj.service_centre.code
      })
      .appendTo(cEvent)

      $('<td>', {
        class: 'event-item',
        text: obj.tracking_code.code
      })
      .appendTo(cEvent)

      $('<td>', {
        class: 'event-item',
        text: obj.user.username
      })
      .appendTo(cEvent)

      cEvent.appendTo(eTable)
    })

    $('#cAudits').fadeIn()
    .click(function() {
      $(this).remove()
    })
  })
    .fail(function() {
      alert('Events Request for ' + p + ' Failed')
  });
}

function getCollectedCons() {
  data.received_at = $('#cDate').val()
  data.status = $('#cStatus').val()
  data.location = 'SWINDON'

  $('#cConsignments').remove()

  $('<div>', {id: 'cLoading'}).appendTo($('#ltInsert'))

  $('<i>', {class: 'ace-icon fa fa-gear fa-spin blue'})
  .appendTo($('#cLoading'))

  $.getJSON(url, data, function(json) {
    if (json.length > 0) {
      var cHeader = $('<thead>', {class: 'consignments-header'})
      var cTable = $('<table>', {id: 'cConsignments'})
      .append(cHeader)

      var tTitles = [
        'Tracking No',
        'Type',
        'Route',
        'Cons. Id',
        'Location',
        'Status'
      ]

      $.each(tTitles, function(i, t) {
        $('<th>', {
          class: 'consignments-header-item',
          text: t
        })
        .appendTo(cHeader)
      })

      $('#ltInsert').append(cTable)

      $.each(json, function(i, obj) {
        var cConsignment = $('<tr>', {class: 'consignment'})

        $('<td>', {
          class: 'consignment-item',
          text: obj.tracking_number,
          id: obj.id
        })
        .click(function() {
          showEvents(obj.id, obj.tracking_number)
        })
        .appendTo(cConsignment)

        $('<td>', {
          class: 'consignment-item',
          text: obj.package_type
        })
        .appendTo(cConsignment)

        $('<td>', {
          class: 'consignment-item',
          text: obj.requested_route
        })
        .appendTo(cConsignment)

        $('<td>', {
          class: 'consignment-item',
          text: obj.consolidation_id
        })
        .appendTo(cConsignment)

        $('<td>', {
          class: 'consignment-item',
          text: obj.location
        })
        .appendTo(cConsignment)

        $('<td>', {
          class: 'consignment-item',
          text: obj.status
        })
        .appendTo(cConsignment)

        $('#cLoading').remove()
        $('#cConsignments').append(cConsignment)
      })
    } else {
      $('#ltInsert').append($('<div>', {
        id: 'cConsignments',
        text: 'Lookup returned no consignments.'
      }))
    }
  })
  .fail(function() {
    console.log('Consignments Request Failed')
  })
}

function consInspector() {

  var cSelect = $('<select>', {id: 'cStatus'})
  $.each(cStatus, function(i, v) {
    $('<option>', {
      value: v,
      text: v
    })
    .appendTo(cSelect)
  })

  var cForm = $('<div>', {id: 'cForm'})
  .append($('<input>', {
    id:'cDate',
    type:'date'
  }))
  .append(cSelect)
  .append($('<button>', {
    id: 'cButton',
    text: 'Look up collections'
  })).click(function(){
    getCollectedCons()
  })

  $('#ltInsert')
  .empty()
  .append(cForm)
}

$.when($.ready).then(function() {
	consInspector();
})
