$(() => {
  let rgroups = {
    2: {
      group: 410,
      routes: [ 6047, 6048, 6049 ]
    },
    3: {
      group: 411,
      routes: [ 7048, 7049, 7050, 7051 ]
    },
    4: {
      group: 412,
      routes: [ 8048, 8049, 8156 ]
    }
  }
  
  let d = new Date()
  let date = d.toJSON().split('T')[0]
  let day = d.getDay()
  
  // urgent = group: 447
  let rgi = rgroups.hasOwnProperty(day) ? rgroups[day].group : 447 
  
  let url = `/routes/?date=${date}&fields=stats&routeGroupId=${rgi}`
  
  $.getJSON(url)
  .then(r => {
    $('#main-container > div:first-child > div.page-content > div:first-child').replaceWith('<div id="routes-data"></div>')
      
    $.each(r, (i,v) => {
      $('<div>').attr({
        'id': v.id,
        'class': 'route'
        }).html(
          `<h2>Route: ${v.route_planned_code}</h2>
          <b>Consignments:</b> ${v.number_of_consignments}<br />
          <b>Reconciled:</b> ${v.reconciled}<br />
          <b>Collected:</b> ${v.collected}<br />
          <b>Delivered:</b> ${v.delivered}<br />
          <b>Undelivered:</b> ${v.undelivered}`
        ).appendTo($('#routes-data'))
    })
    $('#routes-data').css({
      backgroundColor: '#fff',
      margin: '0 auto',
      fontSize: "1.4em",         
      display: 'flex',
      flexFlow: 'row wrap',
      '--pvar': "\f00d"
    })
    $('#routes-data > div').css({
      padding: '2em',
      flex: '0 1 auto'
    })
    let cbs = {
      cursor: 'pointer',
      position:"absolute",
      top:10,
      left:10
    }
    let cb = $('<span>')
    cb.html("&#10006;")
    cb.on('click', ()=> $('#routes-data').remove())
    cb.css(cbs)
    $('#routes-data').append(cb)
  })
})
