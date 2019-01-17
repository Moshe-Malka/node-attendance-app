$(function() {
  $('#add_worker').click(function() {    
    var HOSTNAME = window.location.hostname;  // localhost / node-attendance-app.herokuapp.com
    var PROTOCOL = location.protocol;   // https: / http: 
    console.log('add new worker clicked');
    $.confirm({
      title: 'Adding New Worker',
      content: '' +
        '<form action="" class="formName">' +
        '<div class="form-group">' +
        '<label>Enter worker\'s full name and RFID tag number</label>' +
        '<input type="text" placeholder="Full Name" class="fname form-control" style="margin-bottom: 10px;" required />' +
        '<input type="text" placeholder="RFID tag number" class="rfid form-control" style="margin-bottom: 10px;" required />' +
        '</div>' +
        '</form>',
      buttons: {
        formSubmit: {
          text: 'Add',
          btnClass: 'btn-blue',
          action: function() {
            var fname = this.$content.find('.fname').val();
            var _rfid = this.$content.find('.rfid').val();
            if (!_rfid || !fname) {
              $.alert('Please provide a full name and an RFID number !');
              return false;
            }
            $.post(PROTOCOL+'//'+HOSTNAME+':3000/addNewWorker', {
                rfid: _rfid,
                fname: fname,
              },
              function(data, status) {
                if (data.success) {
                  $.alert('Added new Worker to DB !');
                } else {
                  $.alert('Failed !');
                  console.log('Could not add new worker');
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