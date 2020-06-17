$(() => {
  let rgroups = {
    2: {
      group: 410,
      routes: [ '6047', '6048', '6049' ]
    },
    3: {
      group: 411,
      routes: [ '7048', '7049', '7050', '7051' ]
    },
    4: {
      group: 412,
      routes: [ '8048', '8049', '8156' ]
    }
  }
  
  let d = new Date()
  let date = d.toJSON().split('T')[0]
  let day = d.getDay()
  let $pageContent = $('#main-container > div:first-child > div.page-content')
  let rgi = rgroups.hasOwnProperty(day) ? rgroups[day].group : 447 // urgent = group: 447
  let url = `/routes/?date=${date}&fields=stats&routeGroupId=${rgi}`

  $.getJSON(url)
  .then(r => {
    $pageContent.prepend($('<div>').attr('id', 'routes-data'))
    $.each(r, (i,v) => {
      if(rgroups[day].routes.includes(v.route_planned_code)) {
        console.log(v.route_planned_code)
        $('<div>').attr({
          'id': v.id,
          'class': 'route'
        }).html(
          `<span class='route-header'>Route: ${v.route_planned_code}</span><br />
          <b>Consignments:</b> <span class="ar">${v.number_of_consignments}</span><br />
          <b>Reconciled:</b> <span class="ar">${v.reconciled}</span></span></span></span><br />
          <b>Collected:</b> <span class="ar">${v.collected}</span></span></span><br />
          <b>Delivered:</b> <span class="ar">${v.delivered}</span></span><br />
          <b>Undelivered:</b> <span class="ar">${v.undelivered}</span>`
        ).appendTo($('#routes-data'))
      }
    })
    $('#routes-data').css({
      backgroundColor: '#f5f5f5',
      margin: '0 auto',
      padding: '2em 0',
      fontSize: "1.2em",
      display: 'flex',
      justifyContent: 'space-evenly',
      flexFlow: 'row wrap'
    })
    $('.route-header').css({
      fontSize: '1.8em',
      fontWeight: 600
    })
    $('.ar').css({
      float: 'right'
    })
    $('.route').css({
      border: '1px solid rgba(0,0,0,0.25)',
      backgroundColor: '#fff',
      padding: '0.8em 1.6em',
      flex: '0 1 auto'
    })
    $('.route-header').css({
      fontSize: '1.8em',
      fontWeight: 600
    })
    let cbs = {
      cursor: 'pointer',
      position:"absolute",
      fontSize: '1.8em',
      top: '0.2em',
      right: '1em'
    }

    $('#routes-data').append($('<span>').html("&#10006;").css(cbs).on('click', ()=> $('#routes-data').remove()))
  })
})
