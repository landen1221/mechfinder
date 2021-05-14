var projectsTable = {
    settings: {
        limit: 20,
        query: '',
        sort: 'date_created',
        direction: '1',
        owner: '',
        assigned: ''
    },

    projects: [],

    clicked: {
        more: false,
        sort: false
    },

    loading: {
        more: false
    },

    init: function() {
        console.log('projects table init');
        if(typeof PROJECTS_TABLE_WHERE_OWNER == 'string') projectsTable.settings.owner = PROJECTS_TABLE_WHERE_OWNER;
        if(typeof PROJECTS_TABLE_WHERE_ASSIGNED == 'string') projectsTable.settings.assigned = PROJECTS_TABLE_WHERE_ASSIGNED;

        projectsTable.more();

        $('#projectTableMore').on('click touchmove touchend', function(e) {
            if(e.type !== 'touchmove' && !projectsTable.clicked.more) {
                projectsTable.clicked.more = true;
                setTimeout(function() {
                    projectsTable.clicked.more = false;
                }, 300);

                projectsTable.more();
            }
        });

        $('#projectTableSearch').on('click', function(e) {
            projectsTable.search($('#projectTableSearchQuery').val());
        });

        $('#projectTableSearchQuery').keypress(function(e) {
            if (e.which == 13 || e.keyCode == 13) {
                projectsTable.search($(this).val());
                return false; 
            }
        });
    },

    search: function(query) {
        query = !util.is.nil(query) ? query : projectsTable.settings.query;
        projectsTable.settings.query = query;
        projectsTable.more(true);
    },

    more: function(reset) {
        reset = (typeof reset == 'boolean') ? reset : false;

        if(!projectsTable.loading.more) {
            var projectsLength = projectsTable.projects.length;
            var start = (reset) ? 0 : projectsLength;
            var limit = projectsTable.settings.limit;
            var query = $.param({query: projectsTable.settings.query});
            var sort = projectsTable.settings.sort;
            var direction = projectsTable.settings.direction;
            var owner = projectsTable.settings.owner;
            var assigned = projectsTable.settings.assigned;

            $('#projectTable').append('<tr id="loadingRow" class="projectTableLoadingRow"><td class="center" colspan="100%"><i class="fa fa-cog fa-fw fa-spin"></i></td></tr>');

            var url = '/admin/api/projects?' + query + '&start=' + start + '&limit=' + limit + '&sort=' + sort + '&direction=' + direction + '&owner=' + owner + '&assigned=' + assigned;
            console.log(url);
            var request = $.ajax({
                type: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            });

            request.success(function(projects) {
                console.log('project results from get:');
                console.log(projects);

                if(projects.length > 0) {
                    projectsTable.append(projects, reset);
                } else {
                    $('#projectTable .projectTableLoadingRow').remove();
                    if(reset) alert('There were no projects found matching your search');
                    else alert('There are no more projects in the database matching your search');
                }
            });

            request.fail(function(jqXHR) {
                alert('Error while loading more projects');
                console.log(jqXHR);
            });
        }
    },

    append: function(projects, reset) {
        reset = (typeof reset == 'boolean') ? reset : false;
        if(reset) projectsTable.projects = [];

        var project;
        var html = `
            <tr>
                <th data-sort="title" data-sorted="` + (projectsTable.settings.sort == 'title' ? projectsTable.settings.direction : '0') + `">Title</th>
                <th data-sort="date_created" data-sorted="` + (projectsTable.settings.sort == 'date_created' ? projectsTable.settings.direction : '0') + `">Created</th>
                <th>Owner</th>
                <th>Assigned</th>
                <th data-sort="geo.city" data-sorted="` + (projectsTable.settings.sort == 'geo.city' ? projectsTable.settings.direction : '0') + `">City</th>
                <th data-sort="geo.state" data-sorted="` + (projectsTable.settings.sort == 'geo.state' ? projectsTable.settings.direction : '0') + `">State</th>
                <th data-sort="geo.postal" data-sorted="` + (projectsTable.settings.sort == 'geo.postal' ? projectsTable.settings.direction : '0') + `">Zip</th>
                <th>Actions</th>
            </tr>
        `;
        for(var i=0; i<projects.length; i++) {
            project = projects[i];
            projectsTable.projects.push(project);

            html += `
                <tr>
                    <td title="` + project.title + `"><a href="/admin/project/` + project._id + `">` + project.title + `</a></td>
                    <td title="` + util.time.format(project.date_created, 'MM/DD/YYYY') + ` at ` + util.time.timeOfDay(project.date_created) + `">` + util.time.format(project.date_created, 'MM/DD') + `</td>
                    <td>` + project.owner.username + `</td>
                    <td>` + ((!util.is.nil(project.assigned)) ? project.assigned.username : '') + `</td>
                    <td>` + project.geo.city + `</td>
                    <td>` + project.geo.state + `</td>
                    <td>` + project.geo.postal + `</td>
                    <td class="right">N/A</td>
                </tr>
            `;
        }
        
        $('#projectTable .projectTableLoadingRow').remove();
        if(reset) $('#projectTable').html(html); 
        else $('#projectTable').append(html);

        $('#projectTable th').on('click touchend touchmove', function(e) {
            if(e.type != 'touchmove' && !projectsTable.clicked.sort) {
                projectsTable.clicked.sort = true;
                setTimeout(function() {
                    projectsTable.clicked.sort = false;
                }, 300);

                var sortBy = $(this).data('sort');
                if(!util.is.nil(sortBy)) {
                    var currentSort = $(this).attr('data-sorted') || '-1';
                    var newSort = '1';
                    if(currentSort == '1') newSort = '-1';
                    $('#projectTable th').attr('data-sorted', '0');
                    $(this).attr('data-sorted', newSort);

                    projectsTable.settings.sort = sortBy;
                    projectsTable.settings.direction = newSort;
                    projectsTable.more(true);
                }
            }
        });
    }
};

$(document).ready(function() {
    projectsTable.init();
});