var ticketsTable = {
    settings: {
        limit: 100,
        query: '',
        sort: 'date',
        direction: '0'
    },

    tickets: [],

    clicked: {
        more: false,
        sort: false
    },

    loading: {
        more: false
    },

    id: function(id, index) {
        index = (typeof index === 'boolean') ? index : false;
        for(var i=0; i<ticketsTable.tickets.length; i++) {
            var t = ticketsTable.tickets[i];
            if(t._id == id) {
                if(index) return i;
                else return t;
            }
        }

        return null;
    },

    init: function() {
        console.log('admin ticket init');
        ticketsTable.more();

        $('#ticketTableMore').on('click touchmove touchend', function(e) {
            if(e.type !== 'touchmove' && !ticketsTable.clicked.more) {
                ticketsTable.clicked.more = true;
                setTimeout(function() {
                    ticketsTable.clicked.more = false;
                }, 300);

                ticketsTable.more();
            }
        });

        $('#ticketTableSearch').on('click', function(e) {
            ticketsTable.search($('#ticketTableSearchQuery').val());
        });

        $('#ticketTableSearchQuery').keypress(function(e) {
            if (e.which == 13 || e.keyCode == 13) {
                ticketsTable.search($(this).val());
                return false; 
            }
        });
    },

    search: function(query) {
        query = !util.is.nil(query) ? query : ticketsTable.settings.query;
        ticketsTable.settings.query = query;
        ticketsTable.more(true);
    },

    more: function(reset) {
        reset = (typeof reset === 'boolean') ? reset : false;

        if(!ticketsTable.loading.more) {
            var ticketsLength = ticketsTable.tickets.length;
            var start = (reset) ? 0 : ticketsLength;
            var limit = ticketsTable.settings.limit;
            var query = $.param({query: ticketsTable.settings.query});
            var sort = ticketsTable.settings.sort;
            var direction = ticketsTable.settings.direction;

            $('#ticketTable').append('<tr id="loadingRow" class="ticketTableLoadingRow"><td class="center" colspan="100%"><i class="fa fa-cog fa-fw fa-spin"></i></td></tr>');

            var url = '/admin/api/tickets?' + query + '&start=' + start + '&limit=' + limit + '&sort=' + sort + '&direction=' + direction
            console.log(url);
            var request = $.ajax({
                type: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            });

            request.success(function(tickets) {
                console.log('ticket results from get:');
                console.log(tickets);

                if(tickets.length > 0) {
                    ticketsTable.append(tickets, reset);
                } else {
                    $('#ticketTable .ticketTableLoadingRow').remove();
                    if(reset) alert('There were no tickets found matching your search');
                    else alert('There are no more tickets in the database matching your search');
                }
            });

            request.fail(function(jqXHR) {
                alert('Error while loading more tickets');
                console.log(jqXHR);
            });
        }
    },

    append: function(tickets, reset) {
        console.log('appending tickets');
        reset = (typeof reset == 'boolean') ? reset : false;
        if(reset) ticketsTable.tickets = [];

        var ticket;
        var html = `
            <tr>
                <th data-sort="number" data-sorted="` + (ticketsTable.settings.sort == 'number' ? ticketsTable.settings.direction : '0') + `">#</th>
                <th data-sort="created" data-sorted="` + (ticketsTable.settings.sort == 'created' ? ticketsTable.settings.direction : '0') + `">Created</th>
                <th data-sort="user.username" data-sorted="` + (ticketsTable.settings.sort == 'user.username' ? ticketsTable.settings.direction : '0') + `">Creator</th>
                <th data-sort="project.title" data-sorted="` + (ticketsTable.settings.sort == 'project.title' ? ticketsTable.settings.direction : '0') + `">Project</th>
                <th data-sort="message" data-sorted="` + (ticketsTable.settings.sort == 'message' ? ticketsTable.settings.direction : '0') + `">Category<br />&amp; Message</th>
                <th data-sort="state" data-sorted="` + (ticketsTable.settings.sort == 'state' ? ticketsTable.settings.direction : '0') + `">Status</th>
            </tr>
        `;
        
        for(var i=0; i<tickets.length; i++) {
            ticket = tickets[i];
            ticketsTable.tickets.push(ticket);

            html += `
                <tr>
                    <td title="` + ticket._id + `">` + ticket.number + `</td>
                    <td title="` + util.time.format(ticket.created, 'MM/DD/YYYY') + ` at ` + util.time.timeOfDay(ticket.created) + `">` + util.time.format(ticket.created, 'MM/DD') + `</td>
                    <td title="` + ticket.user.username + `"><a href="/admin/user/` + ticket.user._id + `" target="_blank"><i class="fa fa-` + (ticket.user.role == 'buyer' ? 'user' : 'wrench') + ` fa-fw"></i> ` + ticket.user.username + `</a></td>
                    <td>` + (!util.is.nil(ticket.project) ? '<a href="/admin/project/' + ticket.project._id + '">' + ticket.project.title + '</a>' : '') + `</td>
                    <td title="` + ticket.message + `">` + ticket.category + '<br /><em>' + ticket.message + `</em></td>
                    <td>
                        <select id="state` + ticket._id + `" class="updateState" data-id="` + ticket._id + `">
                            <option ` + (ticket.state == 'open'       ? 'selected="selected"' : '') + ` value="open">Open</option>
                            <option ` + (ticket.state == 'responded'  ? 'selected="selected"' : '') + ` value="responded">Responded</option>
                            <option ` + (ticket.state == 'resolved'   ? 'selected="selected"' : '') + ` value="resolved">Resolved</option>
                            <option ` + (ticket.state == 'closed'     ? 'selected="selected"' : '') + ` value="closed">Closed</option>
                        </select>
                        <i id="stateSaving` + ticket._id + `" class="fa fa-fw"></i>
                    </td>
                </tr>
            `;
        }
        
        $('#ticketTable .ticketTableLoadingRow').remove();
        if(reset) $('#ticketTable').html(html); 
        else $('#ticketTable').append(html);

        $('#ticketTable th').on('click touchend touchmove', function(e) {
            if(e.type != 'touchmove' && !ticketsTable.clicked.sort) {
                ticketsTable.clicked.sort = true;
                setTimeout(function() {
                    ticketsTable.clicked.sort = false;
                }, 300);

                var sortBy = $(this).data('sort');
                if(!util.is.nil(sortBy)) {
                    var currentSort = $(this).attr('data-sorted') || '-1';
                    var newSort = '1';
                    if(currentSort == '1') newSort = '-1';
                    $('#ticketTable th').attr('data-sorted', '0');
                    $(this).attr('data-sorted', newSort);

                    ticketsTable.settings.sort = sortBy;
                    ticketsTable.settings.direction = newSort;
                    ticketsTable.more(true);
                }
            }
        });

        $('.updateState').on('change', function(e) {


            var ticketId = $(this).attr('data-id');
            var state = $(this).val();

             $('#stateSaving' + ticketId).removeClass('fa-check fa-exclamation-triangle').addClass('fa-cog fa-spin').stop().fadeTo(300, 1);

            var body = {
                state: state
            };

            var request = $.ajax({
                method: 'POST',
                url: '/admin/api/tickets/' + ticketId,
                data: body,
                dataType: 'json'
            });

            request.done(function(ticket) {
                console.log('new ticket:');
                console.log(ticket);
                $('#stateSaving' + ticketId).removeClass('fa-cog fa-spin fa-exclamation-triangle').addClass('fa-check').stop().fadeTo(300, 1);
            });

            request.fail(function(jqXHR) {
                alert('There was an error while updating the status of a ticket');
                $('#stateSaving' + ticketId).removeClass('fa-cog fa-spin fa-check').addClass('fa-exclamation-triangle').stop().fadeTo(300, 1);
            });
        });
    }
};

$(document).ready(function() {
    ticketsTable.init();
});