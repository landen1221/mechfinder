var holla = {
    settings: {
        limit: 100,
        query: '',
        sort: 'date',
        direction: '0'
    },

    hollas: [],

    clicked: {
        more: false,
        sort: false,
        acknowledge: false
    },

    loading: {
        more: false
    },

    id: function(id, index) {
        index = (typeof index === 'boolean') ? index : false;
        for(var i=0; i<holla.hollas.length; i++) {
            var h = holla.hollas[i];
            if(h._id == id) {
                if(index) return i;
                else return h;
            }
        }

        return null;
    },

    init: function() {
        console.log('admin holla init');
        holla.more();

        $('#hollaTableMore').on('click touchmove touchend', function(e) {
            if(e.type !== 'touchmove' && !holla.clicked.more) {
                holla.clicked.more = true;
                setTimeout(function() {
                    holla.clicked.more = false;
                }, 300);

                holla.more();
            }
        });

        $('#hollaTableSearch').on('click', function(e) {
            holla.search($('#hollaTableSearchQuery').val());
        });

        $('#hollaTableSearchQuery').keypress(function(e) {
            if (e.which == 13 || e.keyCode == 13) {
                holla.search($(this).val());
                return false; 
            }
        });
    },

    search: function(query) {
        query = !util.is.nil(query) ? query : holla.settings.query;
        holla.settings.query = query;
        holla.more(true);
    },

    more: function(reset) {
        reset = (typeof reset === 'boolean') ? reset : false;

        if(!holla.loading.more) {
            var hollasLength = holla.hollas.length;
            var start = (reset) ? 0 : hollasLength;
            var limit = holla.settings.limit;
            var query = $.param({query: holla.settings.query});
            var sort = holla.settings.sort;
            var direction = holla.settings.direction;

            $('#hollaTable').append('<tr id="loadingRow" class="hollaTableLoadingRow"><td class="center" colspan="100%"><i class="fa fa-cog fa-fw fa-spin"></i></td></tr>');

            var url = '/admin/api/hollas?' + query + '&start=' + start + '&limit=' + limit + '&sort=' + sort + '&direction=' + direction
            console.log(url);
            var request = $.ajax({
                type: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            });

            request.success(function(hollas) {
                console.log('holla results from get:');
                console.log(hollas);

                if(hollas.length > 0) {
                    holla.append(hollas, reset);
                } else {
                    $('#hollaTable .hollaTableLoadingRow').remove();
                    if(reset) alert('There were no hollas found matching your search');
                    else alert('There are no more hollas in the database matching your search');
                }
            });

            request.fail(function(jqXHR) {
                alert('Error while loading more hollas');
                console.log(jqXHR);
            });
        }
    },

    append: function(hollas, reset) {
        reset = (typeof reset == 'boolean') ? reset : false;
        if(reset) holla.hollas = [];

        var hollad;
        var html = `
            <tr>
                <th data-sort="date" data-sorted="` + (holla.settings.sort == 'date' ? holla.settings.direction : '0') + `">Date</th>
                <th data-sort="user.username" data-sorted="` + (holla.settings.sort == 'user.username' ? holla.settings.direction : '0') + `">Username</th>
                <th data-sort="message" data-sorted="` + (holla.settings.sort == 'message' ? holla.settings.direction : '0') + `">Message</th>
                <th data-sort="acknowledged" data-sorted="` + (holla.settings.sort == 'acknowledged' ? holla.settings.direction : '0') + `">Acknowledged</th> 
            </tr>
        `;
        
        for(var i=0; i<hollas.length; i++) {
            hollad = hollas[i];
            holla.hollas.push(hollad);

            html += `
                <tr>
                    <td title="` + util.time.format(hollad.date, 'MM/DD/YYYY') + ` at ` + util.time.timeOfDay(hollad.date) + `">` + util.time.format(hollad.date, 'MM/DD') + `</td>
                    <td title="` + hollad.user.username + `"><a href="` + hollad.href + `" target="_blank"><i class="fa fa-` + (hollad.user.role == 'buyer' ? 'user' : 'wrench') + ` fa-fw"></i> ` + hollad.user.username + `</a></td>
                    <td title="` + hollad.message + `">` + hollad.message + `</td>
                    <td>` + (hollad.acknowledged ? '<i class="acknowledgeHolla acked fa fa-check-circle-o fa-fw" data-id="' + hollad._id + '"></i>' : '<i class="acknowledgeHolla fa fa-circle-o fa-fw" data-id="' + hollad._id + '"></i>') + `</td>
                </tr>
            `;
        }
        
        $('#hollaTable .hollaTableLoadingRow').remove();
        if(reset) $('#hollaTable').html(html); 
        else $('#hollaTable').append(html);

        $('#hollaTable th').on('click touchend touchmove', function(e) {
            if(e.type != 'touchmove' && !holla.clicked.sort) {
                holla.clicked.sort = true;
                setTimeout(function() {
                    holla.clicked.sort = false;
                }, 300);

                var sortBy = $(this).data('sort');
                if(!util.is.nil(sortBy)) {
                    var currentSort = $(this).attr('data-sorted') || '-1';
                    var newSort = '1';
                    if(currentSort == '1') newSort = '-1';
                    $('#hollaTable th').attr('data-sorted', '0');
                    $(this).attr('data-sorted', newSort);

                    holla.settings.sort = sortBy;
                    holla.settings.direction = newSort;
                    holla.more(true);
                }
            }
        });

        $('.acknowledgeHolla').off('click touchend touchmove').on('click touchend touchmove', function(e) {
            if(e.type != 'touchmove' && !holla.clicked.acknowledge) {
                holla.clicked.acknowledge = true;
                setTimeout(function() {
                    holla.clicked.acknowledge = false;
                }, 300);

                var id = $(this).attr('data-id');
                var acked = $(this).hasClass('acked');
                var hollaIndex = holla.id(id, true);

                if(acked) {
                    console.log('is acknowledge, unacknowledging (removing check mark)');
                    $(this).removeClass('acked fa-check-circle-o').addClass('fa-circle-o');
                    holla.hollas[hollaIndex].acknowledged = null;
                } else {
                    console.log('is NOTE ACKED, acknowledging (adding check mark)');
                    $(this).addClass('acked fa-check-circle-o').removeClass('fa-circle-o');
                    holla.hollas[hollaIndex].acknowledged = new Date();
                }

                var body = {};
                var request = $.ajax({
                    method: 'POST',
                    url: '/admin/api/hollas/' + id + '/acknowledge',
                    data: body,
                    dataType: 'json'
                });
            }
        });
    }
};

$(document).ready(function() {
    holla.init();
});