  $(function() {
    var HOSTNAME = window.location.hostname;  // localhost / node-attendance-app.herokuapp.com
    var PROTOCOL = location.protocol;   // https: / http: 
    console.log(HOSTNAME);    
    console.log('Handaling Date-Time Picker');
    function uuid() {
      var uuid = "",
        i, random;
      for (i = 0; i < 12; i++) {
        random = Math.random() * 16 | 0;
        uuid += (i == 4 ? 2 : (i == 8 ? (random & 1 | 4) : random)).toString(16);
      }
      return uuid;
    }
    $("#alertBar").hide();
    var start = moment().subtract(7, 'days');
    var end = moment();

    function cb(start, end) {
      $('#reportrange span').html(start.format('YYYY-MM-DD hh:mm:ss') + ' - ' + end.format('YYYY-MM-DD hh:mm:ss'));
    }
    $('#reportrange').daterangepicker();

    $('#reportrange').daterangepicker({
      startDate: start,
      endDate: end,
      locale: {
        format: 'YYYY-MM-DD hh:mm:ss'
      },
      ranges: {
        'Today': [moment(), moment()],
        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment().endOf('month')],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      }
    }, cb);

    cb(start, end);

    $('#reportrange').on('apply.daterangepicker', function(ev, picker) {
      $.post(PROTOCOL+'//'+HOSTNAME+':3000/getWorkersByDateRange', {
          start: picker.startDate.format('YYYY-MM-DD hh:mm:ss'),
          end: picker.endDate.format('YYYY-MM-DD hh:mm:ss'),
        },
        function(data, status) {
          $("#alertBar").hide();
          $("#mytable > tbody tr").remove();
          if (data.length) {
            var ids = [];
            var tableBody = document.querySelector('#mytable > tbody');
            // get workers object and create tr,td elements for each worker.
            data.forEach(worker => {
              var name_td = document.createElement('td');
              name_td.innerHTML = worker.name;
              name_td.classList.add('col-sm-3');
              var rfid_td = document.createElement('td');
              rfid_td.innerHTML = worker.rfid;
              rfid_td.classList.add('col-sm-3');
              var newTR = document.createElement('tr');
              newTR.appendChild(name_td);
              newTR.appendChild(rfid_td);
              var ts_td = document.createElement('td');
              ts_td.setAttribute('id', 'attendance_timestamps');
              ts_td.setAttribute('colspan', '2');
              worker.attandanceTimestamps.forEach(ts => {
                console.log(worker.name, worker.rfid, ts);
                var _id = worker.rfid + "_" + uuid();
                ids.push(_id);
                var btn_ts =
                  `<button id="${_id}" type="button" class="btn btn-outline-info m-2 btn-sm" aria-label="Close">
                  <i class="glyphicon glyphicon-remove"></i>
                  <span aria-hidden="true">${ts}</span>
                </button>`;
                ts_td.innerHTML += btn_ts;
                newTR.appendChild(ts_td);
              });
              ts_td.classList.add('col-lg-6');
              tableBody.appendChild(newTR);
            });
            // set click listener for each timestamp button. and remove ts from db.
            ids.forEach(id => {
              $(`#${id}`).on("click", function() {
                $.confirm({
                  title: 'Confirm Timestamp Delete',
                  content: 'Are you sure you want to delete this timestamp?',
                  buttons: {
                    confirm: function() {
                      // POST /removeTimestampByRFID (rfid, ts)
                      $.post(PROTOCOL+'//'+HOSTNAME+':3000/removeTimestampByRFID', {
                          rfid: id.split("_")[0],
                          ts: $(`#${id} > span`).text(),
                        },
                        function(data, status) {
                          if (data.success) {
                            $(`#${id}`).remove();
                            $.alert(id + " Removed");
                            console.log(id + " Removed");
                          } else {
                            $.alert('Failed !');
                            console.log('Could not delete timestamp');
                          }
                        });
                    },
                    cancel: function() {
                      // $.alert('Canceled!');
                    }
                  }
                });
              });
            });
          } else {
            $("#alertBar").show();
            // console.log('No workers found in that range');
          }
        }, 'json').fail(function() {
        console.log("error");
      });
    });
  });