var usersTable = {
    settings: {
        role: 'buyer',
        limit: 20,
        query: '',
        sort: 'created',
        direction: '1'
    },

    users: [],

    clicked: {
        more: false,
        sort: false
    },

    loading: {
        more: false
    },

    init: function() {
        console.log('users table init');
        if(!util.is.nil(ROLE)) usersTable.settings.role = ROLE;
        usersTable.more();

        $('#userTableMore').on('click touchmove touchend', function(e) {
            if(e.type !== 'touchmove' && !usersTable.clicked.more) {
                usersTable.clicked.more = true;
                setTimeout(function() {
                    usersTable.clicked.more = false;
                }, 300);

                usersTable.more();
            }
        });

        $('#userTableSearch').on('click', function(e) {
            usersTable.search($('#userTableSearchQuery').val());
        });

        $('#userTableSearchQuery').keypress(function(e) {
            if (e.which == 13 || e.keyCode == 13) {
                usersTable.search($(this).val());
                return false; 
            }
        });
    },

    search: function(query) {
        query = !util.is.nil(query) ? query : usersTable.settings.query;
        usersTable.settings.query = query;
        usersTable.more(true);
    },

    more: function(reset) {
        reset = (typeof reset == 'boolean') ? reset : false;

        if(!usersTable.loading.more) {
            var usersLength = usersTable.users.length;
            var role = usersTable.settings.role;
            var start = (reset) ? 0 : usersLength;
            var limit = usersTable.settings.limit;
            var query = $.param({query: usersTable.settings.query});
            var sort = usersTable.settings.sort;
            var direction = usersTable.settings.direction;

            $('#userTable').append('<tr id="loadingRow" class="userTableLoadingRow"><td class="center" colspan="100%"><i class="fa fa-cog fa-fw fa-spin"></i></td></tr>');

            var url = '/admin/api/users?' + query + '&role=' + role + '&start=' + start + '&limit=' + limit + '&sort=' + sort + '&direction=' + direction;
            var request = $.ajax({
                type: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            });

            request.success(function(users) {
                console.log('new users');
                console.log(users);

                if(users.length > 0) {
                    usersTable.append(users, reset);
                } else {
                    $('#userTable .userTableLoadingRow').remove();
                    if(reset) alert('There are no users found matching your search')
                    else alert('There are no users found matching your search');
                }
            });

            request.fail(function(jqXHR) {
                alert('Error while loading more users');
                console.log(jqXHR);
            });
        }
    },

    append: function(users, reset) {
        reset = (typeof reset == 'boolean') ? reset : false;
        if(reset) usersTable.users = [];

        var user;
        var html = `
            <tr>
                <th data-sort="username" data-sorted="` + (usersTable.settings.sort == 'username' ? usersTable.settings.direction : '0') + `">Username</th>
                <th data-sort="created" data-sorted="` + (usersTable.settings.sort == 'created' ? usersTable.settings.direction : '0') + `">Signup</th>
                <th data-sort="email" data-sorted="` + (usersTable.settings.sort == 'email' ? usersTable.settings.direction : '0') + `">Email</th>
                <th data-sort="geo.city" data-sorted="` + (usersTable.settings.sort == 'geo.city' ? usersTable.settings.direction : '0') + `">City</th>
                <th data-sort="geo.state" data-sorted="` + (usersTable.settings.sort == 'geo.state' ? usersTable.settings.direction : '0') + `">State</th>
                <th data-sort="geo.postal" data-sorted="` + (usersTable.settings.sort == 'geo.postal' ? usersTable.settings.direction : '0') + `">Zip</th>
                <th>Actions</th>
            </tr>
        `;
        for(var i=0; i<users.length; i++) {
            user = users[i];
            usersTable.users.push(user);

            html += `
                <tr>
                    <td title="` + user.first + ` ` + user.last + `"><a href="/admin/user/` + user._id + `">` + user.username + `</a></td>
                    <td title="` + util.time.format(user.created, 'MM/DD/YYYY') + ` at ` + util.time.timeOfDay(user.created) + `">` + util.time.format(user.created, 'MM/DD') + `</td>
                    <td>` + user.email + `</td>
                    <td>` + user.geo.city + `</td>
                    <td>` + user.geo.state + `</td>
                    <td>` + user.geo.postal + `</td>
                    <td class="right">
                        <!--<a href="javascript:void(0);"><i class="fa fa-user fa-fw">-->
                        N/A
                    </td>
                </tr>
            `;
        }
        
        $('#userTable .userTableLoadingRow').remove();
        if(reset) $('#userTable').html(html);
        else $('#userTable').append(html);

        $('#userTable th').on('click touchend touchmove', function(e) {
            if(e.type != 'touchmove' && !usersTable.clicked.sort) {
                usersTable.clicked.sort = true;
                setTimeout(function() {
                    usersTable.clicked.sort = false;
                }, 300);

                var sortBy = $(this).data('sort');
                if(!util.is.nil(sortBy)) {
                    var currentSort = $(this).attr('data-sorted') || '-1';
                    var newSort = '1';
                    if(currentSort == '1') newSort = '-1';
                    $('#userTable th').attr('data-sorted', '0');
                    $(this).attr('data-sorted', newSort);

                    usersTable.settings.sort = sortBy;
                    usersTable.settings.direction = newSort;
                    usersTable.more(true);
                }
            }
        });
    }
};

$(document).ready(function() {
    usersTable.init();
});