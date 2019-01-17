$(function() {  
  $('#add_record').click(function() {
    var HOSTNAME = window.location.hostname;  // localhost / node-attendance-app.herokuapp.com
    var PROTOCOL = location.protocol;   // https: / http: 
    console.log("Adding Timestamp by RFID");
    $.confirm({
      title: 'Adding New Timestamp',
      content: '' +
        '<form action="" class="formName">' +
        '<div class="form-group">' +
        '<label>Enter worker\'s RFID tag number</label>' +
        '<input type="text" placeholder="RFID tag number" class="rfid form-control" style="margin-bottom: 10px;" required />' +
        '<input type="text" placeholder="Timestamp (YYYY-MM-DD hh:mm:ss)" class="new_ts form-control" required />' +
        '</div>' +
        '</form>',
      buttons: {
        formSubmit: {
          text: 'Add',
          btnClass: 'btn-blue',
          action: function() {
            var _rfid = this.$content.find('.rfid').val();
            var new_ts = this.$content.find('.new_ts').val();
            if (!_rfid || !new_ts) {
              $.alert('Please provide an RFID number !');
              return false;
            }
            $.post(PROTOCOL+'//'+HOSTNAME+':3000/addTimestampByRFID', {
                rfid: _rfid,
                newTS: new_ts,
              },
              function(data, status) {
                if (data.success) {
                  createNewButton_ts(_rfid, new_ts);
                  $.alert('Added new Timestamp !');
                } else {
                  $.alert('Failed !');
                  console.log('Could not add new timestamp');
                }
              });
          }
        },
        cancel: function() {
          //close
        },
      },
      onContentReady: function() {
        // bind to events
        var jc = this;
        this.$content.find('form').on('submit', function(e) {
          // if the user submits the form by pressing enter in the field.
          e.preventDefault();
          jc.$$formSubmit.trigger('click'); // reference the button and click it
        });
      }
    });
  });
});

function uuid() {
  var uuid = "",
    i, random;
  for (i = 0; i < 12; i++) {
    random = Math.random() * 16 | 0;
    uuid += (i == 4 ? 2 : (i == 8 ? (random & 1 | 4) : random)).toString(16);
  }
  return uuid;
}

function createNewButton_ts(_rfid, new_ts) {
  var _id = _rfid + "_" + uuid();
  var btn_ts =
    `<button id="${_id}" type="button" class="btn btn-outline-info m-2 btn-sm" aria-label="Close">
    <i class="glyphicon glyphicon-remove"></i>
    <span aria-hidden="true">${new_ts}</span>
  </button>`;
  $('#attendance_timestamps').append(btn_ts);
}