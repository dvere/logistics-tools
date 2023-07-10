/*
 * Copyright (c) 2019 Anthony La Porte <ant@dvere.uk>
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

$(() => {
  var ct_job = location.hash.substring(5)
  var tracking_number = prompt('Enter Tracking Number to check')
  fetch('/map/data/job_mapping?job_no=' + ct_job, {headers: new Headers({Accept: 'application/json'})})
  .then(r => r.json())
  .then(data => {
    let route = data.rows[0]
    let stops = route.stops
    let summary = {
      job: route.JobNumber,
      driver: route.DriverKey,
      route: route.Department,
      date: route.PickupDate,
      start: route.PickupTime,
      end: route.DeliveryTime,
      events: []
    }
    stops.forEach((stop, i) => {
      if (stop.JobItems.filter(o => o.Name === tracking_number).length > 0 ) {
        let item = stop.JobItems.filter(o => o.Name === tracking_number)[0]
        let event = {
          stopid: stop.StopId,
          arrived: stop.ArrivedAtTime,
          address1: stop.Address1,
          address2: stop.Address2,
          postcode: stop.Address6,
          event: item.State,
          item: item
        }
        summary.events.push(event)
      }
    })
    let out = $('<div>', {id: 'tracer'}).css({zIndex: 999999, position: 'fixed', top: 0, left: 0, width:'100vw', height: '100vh', backgroundColor: 'black'}).appendTo($('body'))
    $('<div>', {id: 'tracer_content'}).css({backgroundColor: 'white', margin: '20px auto', color: 'black', padding: '18px'}).appendTo($('#tracer'))
    
    $('#tracer_content').html('<h3 id="cls">HIDE</h3><pre>' + JSON.stringify(summary,undefined,2) + '</pre>')
    $('#cls').on('click', () => $('#tracer').remove())
  })
})
