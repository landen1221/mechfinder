/*$(function () {
  $.widget.bridge('uibutton', $.ui.button);
  $.widget.bridge('uitooltip', $.ui.tooltip);

  $('.datetimepicker').datetimepicker({
    inline: true,
    sideBySide: false
  });

  //Galleries
  $('a[data-gal]').touchTouch();

  $(".button-post-account").click(function () {
    $(".show-post-account").slideDown(400);
  });

  $(".button-post-withdrawal").click(function () {
    $(".show-post-withdrawal").slideDown(400);
  });

  $('#defaultCountdown').countdown({
    until: +259200,
    format: 'DHMS',
    layout: '<div id="timer">' +
    '<div id="vals">' +
    '<div id="d" class="numbs">{dn}</div>' + '<div id="dl" class="labs">d, </div>' +
    '<div id="h" class="numbs">{hnn}</div>' + '<div id="hl" class="labs">h, </div>' +
    '<div id="m" class="numbs">{mnn}</div>' + '<div id="ml" class="labs">m, </div>' +
    '<div id="s" class="numbs">{snn}</div>' + '<div id="sl" class="labs">s</div>' +
    '</div>' +
    '<div id="timer_over"></div>' +
    '</div>'
  });

  $("a").tooltip();

  $('#sandbox-container').find('input').datepicker({
    format: "dd/mm/yyyy",
    autoclose: true,
    todayHighlight: true
  });

  // stopgap, We need good JS

  $('.projekt-hover-1, .projekt-show-1').hover(function () {
    $('.projekt-show-1').show();
  }, function () {
    $('.projekt-show-1').hide();
  });

  $('.projekt-hover-2, .projekt-show-2').hover(function () {
    $('.projekt-show-2').show();
  }, function () {
    $('.projekt-show-2').hide();
  });

  $('.projekt-hover-3, .projekt-show-3').hover(function () {
    $('.projekt-show-3').show();
  }, function () {
    $('.projekt-show-3').hide();
  });

  $('.projekt-hover-4, .projekt-show-4').hover(function () {
    $('.projekt-show-4').show();
  }, function () {
    $('.projekt-show-4').hide();
  });

  $("#chk-body-work").click(function () {
    if ($(this).is(":checked")) {
      $("#body-work").show();
    } else {
      $("#body-work").hide();
    }
  });

  $("#chk-auto-repair").click(function () {
    if ($(this).is(":checked")) {
      $("#auto-repair").show();
    } else {
      $("#auto-repair").hide();
    }
  });

  $("#chk-diagnostic").click(function () {
    if ($(this).is(":checked")) {
      $("#diagnostic").show();
    } else {
      $("#diagnostic").hide();
    }
  });

  $("#chk-electrical").click(function () {
    if ($(this).is(":checked")) {
      $("#electrical").show();
    } else {
      $("#electrical").hide();
    }
  });

  $("#chk-maintenance").click(function () {
    if ($(this).is(":checked")) {
      $("#maintenance").show();
    } else {
      $("#maintenance").hide();
    }
  });

  $("#chk-restoration").click(function () {
    if ($(this).is(":checked")) {
      $("#restoration").show();
    } else {
      $("#restoration").hide();
    }
  });

  $("#chk-windows").click(function () {
    if ($(this).is(":checked")) {
      $("#windows").show();
    } else {
      $("#windows").hide();
    }
  });

  // duplicate hours

  $('.my-form .add-box').click(function () {
    var n = $('.text-box').length + 1;

    var box_html = $('<p class="text-box"><div class="hours-edit"><a class="edit" href="#"><i class="fa fa-pencil"></i></a><a href="#" class="remove-box delete"><i class="fa fa-trash"></i></a><select  name="boxes[]" id="box' + n + '"><option value="Monday">Mon.</option><option value="Monday">Mon.</option><option value="Tuesday">Tues.</option><option value="Wednesday">Wed</option><option value="Thursday">Thurs.</option><option value="Friday">Fri.</option><option value="Saturday">Sat.</option><option value="Sunday">Sun.</option></select><select  name="boxes[]" id="box2' + n + '"><option value="">(open)</option><option value="0"  >12:00 AM</option><option value="1"  >01:00 AM</option><option value="2"  >02:00 AM</option><option value="3"  >03:00 AM</option><option value="4"  >04:00 AM</option><option value="5"  >05:00 AM</option><option value="6"  >06:00 AM</option><option value="7"  >07:00 AM</option><option value="8"  >08:00 AM</option><option value="9"  >09:00 AM</option><option value="10" >10:00 AM</option><option value="11" >11:00 AM</option><option value="12" >12:00 PM</option><option value="13" >01:00 PM</option><option value="14" >02:00 PM</option><option value="15" >03:00 PM</option><option value="16" >04:00 PM</option><option value="17" >05:00 PM</option><option value="18" >06:00 PM</option><option value="19" >07:00 PM</option><option value="20" >08:00 PM</option><option value="21" >09:00 PM</option><option value="22" >10:00 PM</option><option value="23" >11:00 PM</option><option value="24" >12:00 PM</option></select><select  name="boxes[]" id="box3' + n + '"><option value="">(closed)</option><option value="0"  >12:00 AM</option><option value="1"  >01:00 AM</option><option value="2"  >02:00 AM</option><option value="3"  >03:00 AM</option><option value="4"  >04:00 AM</option><option value="5"  >05:00 AM</option><option value="6"  >06:00 AM</option><option value="7"  >07:00 AM</option><option value="8"  >08:00 AM</option><option value="9"  >09:00 AM</option><option value="10" >10:00 AM</option><option value="11" >11:00 AM</option><option value="12" >12:00 PM</option><option value="13" >01:00 PM</option><option value="14" >02:00 PM</option><option value="15" >03:00 PM</option><option value="16" >04:00 PM</option><option value="17" >05:00 PM</option><option value="18" >06:00 PM</option><option value="19" >07:00 PM</option><option value="20" >08:00 PM</option><option value="21" >09:00 PM</option><option value="22" >10:00 PM</option><option value="23" >11:00 PM</option><option value="24" >12:00 PM</option></select></div></p>');
    box_html.hide();
    $('.my-form p.text-box:last').after(box_html);
    box_html.fadeIn('slow');
    return false;
  });
  $('.my-form').on('click', '.remove-box', function () {
    $(this).parent().fadeOut("slow", function () {
      $(this).remove();
      $('.box-number').each(function (index) {
        $(this).text(index + 1);
      });
    });
    return false;
  });

  // Advanced Search

  $("#advanced-click").click(function () {
    $("#advanced-search").slideToggle()(500);
  });

  // title tabs profile

  $('a[data-toggle="tab"]').on('shown.bs.tab', function () {
    if ($("#myTab-mechanic")[0].className == 'overview active')
      $('#title-mechanic').show();
    else
      $('#title-mechanic').hide();

    if ($("#myTab-photo")[0].className == 'overview active')
      $('#title-photo').show();
    else
      $('#title-photo').hide();

    if ($("#myTab-basic")[0].className == 'overview active')
      $('#title-basic').show();
    else
      $('#title-basic').hide();
  });

  // select mobile profle

  $("#select-number").change(function () {
    if ($("#mobile-option").is(":selected")) {
      $("#verifiy-number").show();
    } else {
      $("#verifiy-number").hide();
    }
  }).trigger('change');

  $(".carrier-accept").hide();
  $(".question-carrier").click(function () {
    if ($(this).is(":checked")) {
      $(".carrier-accept").show();
    } else {
      $(".carrier-accept").hide();
    }
  });

  $('#send-veryfication').click(function () {
    $('#pin-show-div').slideDown('fast')
  });
  $('#complete-veryfication').click(function () {
    $('#gratulations').slideDown('fast')
  });

  $(".make-switch input[type='checkbox']").bootstrapSwitch();

  $('#confirm-delete').on('show.bs.modal', function (e) {
    $(this).find('.btn-ok').attr('href', $(e.relatedTarget).data('href'));
  });

  $('#confirm-delete2').on('show.bs.modal', function (e) {
    $(this).find('.btn-ok').attr('href', $(e.relatedTarget).data('href'));
  });

  // Get a Started

  $('#customer-get-started').click(function () {
    $('#form-buyer').show();
    $('#form-seller').hide();
    $('#customer-question').slideDown('fast');
    $('#mechanic-question').hide();
    $('#post-password-get-a-started').hide();
    $('.border-active-customer').addClass('selected-customer');
    $('.border-active-customer-mechanic').removeClass('selected-customer');

  });
  $('#mechanic-get-started').click(function () {
    $('#form-buyer').hide();
    $('#form-seller').show();
    $('#mechanic-question').slideDown('fast');
    $('#customer-question').hide();
    $('#post-password-get-a-started').hide();
    $('.border-active-customer-mechanic').addClass('selected-customer');
    $('.border-active-customer').removeClass('selected-customer');
  });

  $('.next-get-a-started').click(function () {
    $('#post-password-get-a-started').slideDown('fast')
  });

  //accordion guided tour
  $("#accordion").accordion();

  // filters category guided tour
  $('.filters li').click(function () {
    var id = $(this).attr('id');
    var $categories = $('[class*=category-]');

    $categories.hide('fast', 'linear');

    if (id === 'all') {
      $categories.show('fast', 'linear');
    } else {
      $('.category-' + id).show('fast', 'linear');
    }
  });

  var selector = '.filters li';

  $(selector).on('click', function () {
    $(selector).removeClass('active-video');
    $(this).addClass('active-video');
  });

  // sign up
  $('#next-to-sign-up').click(function () {
    $('#show-step2-signup').slideDown('fast');
    $('#show-step1-signup').hide()
  });

  $('#back-up-sign-up').click(function () {
    $('#show-step1-signup').slideDown('fast');
    $('#show-step2-signup').hide()
  });
});*/
