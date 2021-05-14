var roleSwitch = {
    user: null,

    init: function() {
        console.log('admin user role switch init');

        if(util.is.nil(USER)) return window.location.reload(true);
        roleSwitch.user = USER;

        $('#userRoleSaving').stop().fadeTo(1, 0);

        roleSwitch.clicks.init();
    },

    clicks: {
        clicked: {
            save: false
        },

        init: function() {
            $('#userRoleSave').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !roleSwitch.clicks.clicked.save) {
                    roleSwitch.clicks.clicked.save = true;
                    setTimeout(function() {
                        roleSwitch.clicks.clicked.save = false;
                    }, 300);

                    var role = $('input:radio[name="userRole"]:checked').val();
                    console.log('the role: \n\n\n:' + role);
                    roleSwitch.updateRole(role);
                }
            });
        }
    },

    updateRole: function(role) {
        if(confirm('Are you 100% positive you want to do this? This user will no longer be able to see any past projects that they were a part of if you continue')) {
            if(role == 'buyer' || role == 'seller') {
                $('#userRoleSaving').removeClass('fa-check fa-exclamation-triangle').addClass('fa-cog fa-spin').stop().fadeTo(300, 1);

                var body = {
                    userId: roleSwitch.user._id,
                    role: role
                };

                var request = $.ajax({
                    method: 'POST',
                    url: '/admin/api/updateRole',
                    data: body,
                    dataType: 'json'
                });

                request.done(function(data) {
                    $('#userRoleSaving').removeClass('fa-cog fa-spin').addClass('fa-check');
                    window.location.reload(true);
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    alert('There was an error while saving the user role');
                    $('#userRoleSaving').removeClass('fa-cog fa-spin').addClass('fa-exclamation-triangle');
                });
            } else {
                alert('Invalid role type');
            }
        }
    }
};

$(document).ready(function(e) {
    roleSwitch.init();
});