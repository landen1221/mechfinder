util = require('util')
handlebars = require('handlebars')
moment = require('moment')
humanize = require('humanize')
markdown = require('markdown')
{title, merge, union, shallow, compare_document, STATES} = require('./util')

handlebars.registerHelper 'inspect',       (x) -> util.inspect x, false, 3
handlebars.registerHelper 'deccurrency',   (number) -> if number? then new handlebars.SafeString('<span class="label label-info">$' + humanize.numberFormat(number / 100) + '</span>') else ''
handlebars.registerHelper 'integer',       (number) -> if number? then humanize.numberFormat(number, 0) else ''
handlebars.registerHelper 'number',        (number, options) -> if number? then humanize.numberFormat(number, if options?.hash?.places? then options.hash.places else 0) else ''
handlebars.registerHelper 'yesno',         (bool) -> if bool then 'Yes' else 'No'
handlebars.registerHelper 'titlecase',     (x) -> title x
handlebars.registerHelper 'json',          (x) -> new handlebars.SafeString(JSON.stringify(x))
handlebars.registerHelper 'to_input_name', (x) -> x.replace /[-.]/g, '_'                            # converts typicaly html ids to appropriate input names
handlebars.registerHelper 'markdown',      (md) -> new handlebars.SafeString("<div class=\"markdown\">#{markdown.parse(md)}</div>")
handlebars.registerHelper 'with',          (context, options) -> options.fn(context)
handlebars.registerHelper 'charge_or_refund', (number) -> if number > 0 then 'Refund' else 'Charge'
handlebars.registerHelper 'monthNumber', (date) -> if date? then return date.getMonth() + 1 else return ''
handlebars.registerHelper 'dayNumber', (date) -> if date? then return date.getDate() else return ''
handlebars.registerHelper 'yearNumber', (date) -> if date? then return date.getFullYear() else return ''


handlebars.registerHelper 'date', (date, zonify, zonifyFormat) ->
    zonify = if typeof zonify is 'boolean' then zonify else false
    zonifyFormat = if typeof zonifyFormat is 'string' then zonifyFormat else 'MM/DD/YYYY'
    if date?
        first = if zonify then '<span class="zonify" data-date="' + date + '" data-format="' + zonifyFormat + '">' else ''
        last = if zonify then '</span>' else ''
        return new handlebars.SafeString(first + moment(date).format('L') + last)
    else
        ''

handlebars.registerHelper 'time',          (date) -> if date? then moment(date).format('LT') else ''
handlebars.registerHelper 'hour',          (hour) -> if hour then moment().hour(hour).format('hh:00 A') else ''
handlebars.registerHelper 'since',         (date) -> if date? then moment(date).fromNow() else ''

handlebars.registerHelper 'truncate', (text, length) ->
    return '' unless text and length
    truncated = ''
    if text.length > length
        truncated = text.substring(0, length - 3) + '...'
    else if text.length <= length
        truncated = text
    return new handlebars.SafeString(truncated)

handlebars.registerHelper 'dashboardTile', (title, options) ->
    return '' unless title
    attrs = []
    # for prop of options.hash
        # attrs.push Handlebars.escapeExpression(prop) + '="' + Handlebars.escapeExpression(options.hash[prop]) + '"'
    html = ''
    classes = if options.hash.classes then options.hash.classes else ''
    href = if options.hash.datahref then 'data-href="' + options.hash.datahref + '"' else ''
    icon = if options.hash.icon then options.hash.icon else ''
    user = options.hash.user if options.hash.user

    if user and options.hash.avgRating
        icon = handlebars.helpers.ratingIcons(user.average_rating, user.role)
        title = 'You have an average rating of ' + user.average_rating

    html += '<div class="tile-holder">'
    if options.hash.recentRating is true
        return '' unless user
        html += '<div class="tile double blue tile-clickable" title="' + handlebars.helpers.latestRating("notesFull", user.ratings, user.role)
        html +=     '" data-href="/projects/' + handlebars.helpers.latestRating("project", user.ratings, user.role) + '">'
        html +=     '<span class="tile-info">' + handlebars.helpers.latestRating("notes", user.ratings, user.role) + '</span>'
        html +=     '<span class="tile-text">Latest review: ' + handlebars.helpers.latestRating("stars", user.ratings, user.role) + '</span>'
    else
        if options.hash.profile is true and user
            html += '<div class="tile ' + classes + '" data-href="/profile/'
            html += user._id + '/public">'
        else
            html += '<div class="tile ' + classes + '" ' + href + '">'
        if options.hash.faIcon
            html +=     '<span class="tile-icon fa ' + options.hash.faIcon + '"></span>'
        else if options.hash.infoText
            html +=     '<span class="tile-info">' + options.hash.infoText + '</span>'
        else
            html +=     '<span class="tile-icon">' + icon + '</span>'
        html +=     '<span class="tile-text">' + title + '</span>'
    html += '</div>'
    html += '</div>'

    return new handlebars.SafeString(html)

handlebars.registerHelper 'ratingIcons', (averageRating, role) ->
    return '' if averageRating <= 0
    rounded = parseInt(Math.round(averageRating))
    faKind = if role is 'seller' then 'wrench' else 'star'

    html = ''
    i = 0
    while i < 5
        offStr = if i < rounded then '' else 'off'
        html += '<i class="fa fa-' + faKind + ' ' + offStr + '"></i>'
        i++

    return new handlebars.SafeString(html)

handlebars.registerHelper 'projectRating', (mechanicRatings, customerRatings, projectId, role) ->
    return '' unless mechanicRatings and customerRatings and projectId

    fullRatingOfMech = mechanicRatings.filter (item) ->
        String(item.rel) == String(projectId)
    fullRatingOfCust = customerRatings.filter (item) ->
        String(item.rel) == String(projectId)

    commentAboutCust = '<td>This project has not yet been rated by the mechanic</td>'
    ratingOfCust = '<td></td>'
    commentAboutCust = '<td>' + fullRatingOfCust[0].notes + '</td>' unless fullRatingOfCust.length < 1
    ratingOfCust = '<td class="rating">' + handlebars.helpers.ratingIcons(fullRatingOfCust[0].stars, 'buyer') + '</td>' unless fullRatingOfCust.length < 1

    commentAboutMech = '<td>This project has not yet been rated by the customer</td>'
    ratingOfMech = '<td></td>'
    commentAboutMech = '<td>' + fullRatingOfMech[0].notes + '</td>' unless fullRatingOfMech.length < 1
    ratingOfMech = '<td class="rating">' + handlebars.helpers.ratingIcons(fullRatingOfMech[0].stars, 'seller') + '</td>' unless fullRatingOfMech.length < 1

    html = '<tr>' + ratingOfMech + commentAboutMech + '</tr><tr>' + ratingOfCust + commentAboutCust + '</tr>'
    html = ratingOfMech + commentAboutMech if role is 'seller'
    html = ratingOfCust + commentAboutCust if role is 'buyer'

    return new handlebars.SafeString(html)

handlebars.registerHelper 'profileRating', (mechanicRatings, customerRatings, projectId) ->
    return '' unless mechanicRatings and customerRatings and projectId

    fullRatingOfMech = mechanicRatings.filter (item) ->
        String(item.rel) == String(projectId)
    fullRatingOfCust = customerRatings.filter (item) ->
        String(item.rel) == String(projectId)

    commentAboutCust = '<td class="review hidden">This project has not been rated by either party</td>'
    commentAboutCust = '<td class="review hidden">This project has not yet been rated by the mechanic</td>' if fullRatingOfCust.length < 1
    commentAboutCust = '<td class="review hidden">This review will show once the mechanic is rated on this project</td>' if fullRatingOfMech.length < 1 and fullRatingOfCust.length > 0
    ratingOfCust = '<td class="rating hidden"></td>'
    commentAboutCust = '<td class="review hidden">' + fullRatingOfCust[0].notes + '</td>' unless fullRatingOfCust.length < 1 or fullRatingOfMech.length < 1
    ratingOfCust = '<td class="rating hidden">' + handlebars.helpers.ratingIcons(fullRatingOfCust[0].stars, 'buyer') + '</td>' unless fullRatingOfCust.length < 1 or fullRatingOfMech.length < 1

    commentAboutMech = '<td class="review visible">This project has not been rated by either party</td>'
    commentAboutMech = '<td class="review visible">This project has not yet been rated by the customer</td>' if fullRatingOfMech.length < 1
    commentAboutMech = '<td class="review visible">This review will show once the customer is rated on this project</td>' if fullRatingOfCust.length < 1 and fullRatingOfMech.length > 0
    ratingOfMech = '<td class="rating visible"></td>'
    commentAboutMech = '<td class="review visible">' + fullRatingOfMech[0].notes + '</td>' unless fullRatingOfMech.length < 1 or fullRatingOfCust.length < 1
    ratingOfMech = '<td class="rating visible">' + handlebars.helpers.ratingIcons(fullRatingOfMech[0].stars, 'seller') + '</td>' unless fullRatingOfMech.length < 1 or fullRatingOfCust.length < 1

    html = ratingOfMech + ratingOfCust + commentAboutMech + commentAboutCust

    return new handlebars.SafeString(html)

handlebars.registerHelper 'latestRating', (need, array, role) ->
    return '' unless array.length > 0
    return '' unless need and role and array
    return new handlebars.SafeString(handlebars.helpers.ratingIcons(array[array.length - 1].stars, role)) if need is 'stars'
    fullnote = array[array.length - 1].notes
    note = fullnote
    note = array[array.length - 1].notes.substring(0, 100) + "..." if fullnote.length > 100
    return new handlebars.SafeString(note) if need is 'notes'
    return new handlebars.SafeString(fullnote) if need is 'notesFull'
    return new handlebars.SafeString(array[array.length - 1].rel) if need is 'project'
    return new handlebars.SafeString(array[array.length - 1].stars)

handlebars.registerHelper 'latestRatingStar', (array, role) ->
    return new handlebars.SafeString(handlebars.helpers.ratingIcons(array[array.length - 1].stars, role))

handlebars.registerHelper 'latestRatingNotes', (array) ->
    return new handlebars.SafeString(array[array.length - 1].notes)

handlebars.registerHelper 'toPercentage', (d, symbold, decimalPlaces) ->
    symbol = if typeof symbol is 'boolean' then symbol else true
    decimalPlaces = if decimalPlaces or decimalPlaces is 0 then decimalPlaces else -1

    d *= 100

    if decimalPlaces > 0
        power = Math.pow(10, decimalPlaces);
        rounded = Math.round(d * power) / power;
        d = rounded.toFixed(decimalPlaces);

    symbolChar = if symbol then '%' else '';
    return d + symbolChar;

handlebars.registerHelper 'stateOptions', () ->
    states = STATES['us']
    html = ''
    for key of states
        html += '<option value="' + key + '">' + states[key] + '</option>'
    # console.log states
    # console.log STATES
    return new handlebars.SafeString(html)


handlebars.registerHelper 'projectHoursRows', (hours) ->
    return '' unless hours

    html = ''
    i = 0
    while i < 7
        hour = hours[i]
        html += '<tr>'
        if hour.open and hour.close
            html += '<td>' + handlebars.helpers.dayName(i) + '</td>'
            html += '<td>' + handlebars.helpers.timeDisplay(hour.open) + '</td>'
            html += '<td>' + handlebars.helpers.timeDisplay(hour.close) + '</td>'
        else
            html += '<td>' + handlebars.helpers.dayName(i) + '</td>'
            html += '<td colspan="2">(Closed)</td>'
        html += '</tr>'
        i++

    return new handlebars.SafeString(html)

handlebars.registerHelper 'transactionMFPercentage', (transaction) ->
    return handlebars.helpers.toPercentage(transaction.fee / transaction.amount, true, 2)

handlebars.registerHelper 'transactionMechPayout', (transaction) ->
    return handlebars.helpers.currency(transaction.amount - transaction.fee)

handlebars.registerHelper 'transactionStatus', (status, escrowStatus) ->
    result = ''
    switch status
        when 'submitted_for_settlement','settlement_pending','settled','settling'
            return 'Refunded' if escrowStatus in ['refunded', 'refunding', 'refund_pending']
            return 'Released' if escrowStatus in ['release', 'release_pending', 'releasing']
            return 'In Escrow'
        when 'voided'
            return 'Void'
        when 'failed','gateway_rejected','processor_declined','authorization_expired','settlement_declined'
            return 'Error'
        # when 'authorized'
        else
            return ''

handlebars.registerHelper 'estimateWorkorderMarkup', (estimate, userId) ->
    estimateOwnerId = estimate.owner
    estimateOwnerId = estimate.owner._id if estimate.owner._id
    console.log estimate.laborTaxAmount

    isOwner = false
    isOwner = true if estimateOwnerId.equals userId
    html = ''

    if estimate.parts and estimate.parts.length > 0
        html += '<div class="card-header small left">Parts &amp; Materials</div>'
        html += '<table class="mf-mobile-table mf-mobile-table-styled full-width">'
        html += '<tr>'
        html += '<th>Part Name</th>'
        html += '<th>Quantity</th>'
        html += '<th>Unit Price</th>'
        html += '<th>Line Total</th>'
        html += '</tr>'

        for part in estimate.parts
            html += '<tr>'
            html += '<td>' + part.label + '</td>'
            html += '<td>' + part.quantity + '</td>'
            html += '<td>' + handlebars.helpers.currency(part.cost) + '</td>'
            html += '<td>' + handlebars.helpers.currency(part.cost * part.quantity) + '</td>'
            html += '</tr>'
        
        html += '<tr>'
        html += '<td class="fill-space" colspan="2"></td>'
        html += '<td class="nowrap">Subtotal</td>'
        html += '<td>' + handlebars.helpers.currency(estimate.partsAmount) + '</td>'
        html += '</tr>'
        
        html += '<tr>'
        html += '<td class="fill-space" colspan="2"></td>'
        html += '<td class="nowrap">Tax</td>'
        html += '<td>' + handlebars.helpers.currency(estimate.partsTaxAmount) + '</td>'
        html += '</tr>'

        html += '</table>'
        html += '<div class="empty-break"></div>'
    
    if estimate.labor and estimate.labor.length > 0
        html += '<div class="card-header small left">Labor &amp; Services</div>'
        html += '<table class="mf-mobile-table mf-mobile-table-styled full-width">'
        html += '<tr>'
        html += '<th>Name</th>'
        html += '<th>Hours</th>'
        html += '<th>Rate</th>'
        html += '<th>Line Total</th>'
        html += '</tr>'

        for labor in estimate.labor
            html += '<tr>'
            html += '<td>' + labor.label + '</td>'
            html += '<td>' + labor.hours + '</td>'
            html += '<td>' + handlebars.helpers.currency(labor.rate) + '</td>'
            html += '<td>' + handlebars.helpers.currency(labor.rate * labor.hours) + '</td>'
            html += '</tr>'
        
        html += '<tr>'
        html += '<td class="fill-space" colspan="2"></td>'
        html += '<td class="nowrap">Subtotal</td>'
        html += '<td>' + handlebars.helpers.currency(estimate.laborAmount) + '</td>'
        html += '</tr>'
        
        html += '<tr>'
        html += '<td class="fill-space" colspan="2"></td>'
        html += '<td class="nowrap">Tax</td>'
        html += '<td>' + handlebars.helpers.currency(estimate.laborTaxAmount) + '</td>'
        html += '</tr>'

        html += '</table>'
        html += '<div class="empty-break"></div>'
    
    html += '<div class="card-header small left">Total Estimate</div>'
    html += '<table class="mf-mobile-table mf-mobile-table-styled full-width">'

    html += '<tr>'
    html += '<td class="fill-space"></td>'
    html += '<td class="nowrap">Parts &amp; Labor</td>'
    html += '<td>' + handlebars.helpers.currency(estimate.partsLaborAmount) + '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td class="fill-space"></td>'
    html += '<td class="nowrap">Tax Amount</td>'
    html += '<td>' + handlebars.helpers.currency(estimate.taxAmount) + '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td class="fill-space"></td>'
    html += '<td class="nowrap">' + (if isOwner then 'Referral' else 'Service') + ' Fee</td>'
    html += '<td>' + handlebars.helpers.currency(if isOwner then -estimate.sellerReferralAmount else estimate.buyerReferralAmount) + '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td class="fill-space"></td>'
    html += '<td class="nowrap">Diagnosis Waiver</td>'
    html += '<td>' + handlebars.helpers.currency(-estimate.diagnosisWaiver) + '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td class="fill-space"></td>'
    html += '<td class="nowrap">Total</td>'
    html += '<td>' + handlebars.helpers.currency(if isOwner then estimate.sellerTotal else estimate.buyerTotal) + '</td>'
    html += '</tr>'
    html += '</table>'
    
    return new handlebars.SafeString html


handlebars.registerHelper 'assignedEstimatesTableRows', (estimates, viewer, project) ->
    isOwner = false
    isOwner = true if viewer._id.equals project.owner._id
    isSeller = false
    isSeller = true if project.assigned._id and viewer._id.equals project.assigned._id
    html = ''
    i = 0

    html += '<tr>'
    html += '<th>Status</th>' if isSeller or isOwner
    html += '<th>Date</th>'
    html += '<th>Mechanic</th>'
    html += '<th>Business Type</th>'
    html += '<th>Included</th>'
    html += '<th>Full Estimate</th>' if isOwner and not project.diagnosis
    html += '<th>Diagnosis Price</th>' if isOwner and project.diagnosis
    html += '<th>Waive if Hired</th>' if project.diagnosis
    html += '<th class="hideMobile">Actions</th>'
    html += '</tr>'
    while i < estimates.length
        estimate = estimates[i]
        isBidder = false
        isBidder = true if project.assigned._id.equals estimate.owner._id
        if isBidder and estimate.state isnt "retracted" and estimate.state isnt "canceled"
            html += '<tr id="estimateRow' + estimate._id + '">'

            stateVerbiage =
                submitted:  'Submitted'
                accepted:   'Hired'
                canceled:   'Canceled'
                retracted:  'Canceled'
                requested:  'Payment Requested'
                released:   'Paid'
                refunded:   'Refunded'

            html += '<td id="estimateState' + estimate._id + '" class="titlecase">' + stateVerbiage[estimate.state] + '</td>' if isSeller or isOwner
            html += '<td>' + handlebars.helpers.date(estimate.date_submitted) + '</td>'
            inlineRating = ''
            inlineRating = '</br><span title="Average rating: ' + estimate.owner.average_rating + '">' + handlebars.helpers.ratingIcons(estimate.owner.average_rating, estimate.owner.role) + '</span>' if estimate.owner.average_rating > 0
            html += '<td><strong><a href="/profile/' + estimate.owner._id + '/public" target="_blank">' + estimate.owner.username + ' </a></strong> ' + inlineRating + ' </td>'
            html += '<td>' + (estimate.owner.mechanicType[0].toUpperCase() + estimate.owner.mechanicType.slice(1)) + '</td>'
            html += '<td>'
            if estimate.labor.length > 0 and estimate.parts.length > 0
                html += 'Parts &amp; Labor'
            else if estimate.labor.length > 0
                html += 'Labor Only'
            else
                html += 'Parts Only'
            html += '</td>'
            html += '<td>' + handlebars.helpers.currency(if isOwner then estimate.buyerTotal else estimate.sellerTotal) + '</td>' if isOwner
            html += '<td>' + handlebars.helpers.yesno(estimate.diagnosisWaived) + '</td>' if project.diagnosis

            perms =
                view: true
                breakdown: true
                profile: true
                hire: true
                request: true
                release: true
                review: true
                dispute: true
                cancel: true
                edit: true
                message: true
                none: false

            perms.view = false if project.diagnosis
            perms.breakdown = false unless isOwner or isSeller
            perms.hire = false unless isOwner and estimate.state is 'submitted'
            perms.request = false unless estimate.state is 'accepted' and isSeller
            perms.release = false unless isOwner and estimate.state is 'requested' and (not project.diagnosis)
            perms.review = false unless (isOwner or isBidder) and project.diagnosis and project.child and project.child.state in ['reviewing'] and (not perms.release)
            perms.dispute = false if estimate.state is 'released' or not (isSeller or isOwner)
            perms.profile = false if isSeller or isOwner
            perms.cancel = false unless estimate.state is 'submitted' and isSeller
            perms.edit = false unless isSeller and estimate.state is 'submitted'
            perms.message = false unless isOwner and estimate.state in ['submitted', 'released', 'accepted']
            perms.none = true unless perms.view or perms.hire or perms.request or perms.release or perms.dispute or perms.cancel or perms.profile

            contactIds = project.assigned._id
            defaultAction = 'contact-action'
            defaultText = 'Message'
            defaultAction = 'viewWorkorder' if perms.view
            defaultText = 'View' if perms.view
            defaultAction = 'hireSeller' if perms.hire
            defaultText = 'Hire' if perms.hire
            defaultAction = 'requestPayment' if perms.request
            defaultText = 'Request Payment' if perms.request
            defaultAction = 'releaseFunds' if perms.release
            defaultText = 'Release Payment' if perms.release

            if perms.none
                html += '<td><i>N/A</td>'
            else
                html += '<td><div class="mf-button-dropdown"><div class="mf-button main-button ' + defaultAction + '" data-bid="' + estimate._id + '" + data-ids="' + contactIds + '">' + defaultText + '</div><div class="mf-button dropdown-button menu estimateDropdown" id="estimateDropdown' + estimate._id + '"><i class="fa fa-chevron-down estimateDropdownIcon"></i><div class="dropdown"><ul>'
                html += '<li><a class="hireSeller" data-bid="' + estimate._id + '" href="javascript:void(0);">Hire</a></li>' if perms.hire
                html += '<li><a class="viewWorkorder ' + (if perms.breakdown then '' else 'no-breakdown') + '" data-bid="' + estimate._id + '" href="javascript:void(0);">View Estimate</a></li>' if perms.view
                html += '<li><a class="editDiagnosis" href="javascript:void(0);">Edit Diagnosis</a></li>' if perms.edit and project.diagnosis
                html += '<li><a class="editWorkorder" href="javascript:void(0);">Edit Estimate</a></li>' if perms.edit and not project.diagnosis
                html += '<li><a href="/profile/' + estimate.owner + '" target="_blank">View Mechanic</a></li>' if perms.profile
                html += '<li><a class="requestPayment" data-bid="' + estimate._id + '" href="javascript:void(0);">Request Payment</a></li>' if perms.request
                html += '<li><a class="releaseFunds" data-bid="' + estimate._id + '" href="javascript:void(0);">Release Funds</a></li>' if perms.release
                html += '<li><a href="/projects/' + project.child._id.toString() + '/review">Review Draft</a></li>' if perms.review
                html += '<li><a class="startDispute" data-bid="' + estimate._id + '" href="javascript:void(0);">Help</a></li>' if perms.dispute
                html += '<li><a class="cancelEstimate" data-bid="' + estimate._id + '" href="javascript:void(0);">Cancel Estimate</a></li>' if perms.cancel
                html += '<li><a class="contact-action" data-ids="' + project.assigned._id + '" href="javascript:void(0);">Message</a></li>' if perms.message
                html += '</ul></div></div></div></td></tr>'

        i++

    return new handlebars.SafeString(html)

handlebars.registerHelper 'estimatesTableRows', (estimates, viewer, project) ->
    isOwner = false
    isOwner = true if viewer._id.equals project.owner._id
    html = ''
    i = 0
    c = 0

    html += '<tr>'
    # html += '<th class="mf-table-sm">Estimate #</th>'
    html += '<th>Date</th>'
    html += '<th>Mechanic</th>' if isOwner
    html += '<th class="mf-table-md">Business Type</th>'
    html += '<th class="mf-table-md">Included</th>' unless project.diagnosis
    html += '<th>Full Estimate</th>' if isOwner and not project.diagnosis
    html += '<th>Diagnosis Price</th>' if isOwner and project.diagnosis
    html += '<th>Waive if Hired</th>' if project.diagnosis
    html += '<th class="hideMobile">Actions</th>'
    html += '</tr>'
    while i < estimates.length
        estimate = estimates[i]
        isBidder = false
        isBidder = true if viewer._id.equals estimate.owner._id
        if estimate.state is 'submitted'
            c += 1
            html += '<tr id="estimateUser' + estimate.owner._id + '">'
            # html += '<td class="mf-table-sm">' + c + '</td>'
            html += '<td data-username="' + estimate.owner.username + '">' + handlebars.helpers.date(estimate.date_submitted) + '</td>'
            inlineRating = ''
            inlineRating = '</br><span title="Average rating: ' + estimate.owner.average_rating + '">' + handlebars.helpers.ratingIcons(estimate.owner.average_rating, estimate.owner.role) + '</span>' if estimate.owner.average_rating > 0
            html += '<td><strong><a href="/profile/' + estimate.owner._id + '/public" target="_blank">' + estimate.owner.username + ' </a></strong> ' + inlineRating + ' </td>' if isOwner
            html += '<td>' + (estimate.owner.mechanicType[0].toUpperCase() + estimate.owner.mechanicType.slice(1)) + '</td>'
            if not project.diagnosis
                html += '<td>'            
                if estimate.labor.length > 0 and estimate.parts.length > 0
                    html += 'Parts &amp; Labor'
                else if estimate.labor.length > 0
                    html += 'Labor Only'
                else
                    html += 'Parts Only'
                html += '</td>'
            html += '<td>' + handlebars.helpers.currency(estimate.buyerTotal) + '</td>' if isOwner
            html += '<td>' + handlebars.helpers.yesno(estimate.diagnosisWaived) + '</td>' if project.diagnosis

            perms =
                view: true
                hire: true
                edit: true
                cancel: true
                profile: true

            perms.view = false unless (isBidder or isOwner) and (not project.diagnosis)  
            perms.hire = false unless isOwner and estimate.state is 'submitted'
            perms.edit = false unless isBidder
            perms.cancel = false unless estimate.state is 'submitted' and isBidder
            perms.profile = false if isBidder
            perms.message = false unless isOwner and estimate.state in ['submitted', 'released', 'accepted']
            perms.none = true unless perms.view or perms.hire or perms.edit or perms.cancel or perms.profile

            contactIds = ''
            defaultHref = 'javascript:void(0);'
            defaultAction = ''
            defaultText = ''
            defaultHref = '/profile/' + estimate.owner._id if perms.profile
            defaultText = 'View Mechanic' if perms.profile
            defaultHref = 'javascript:void(0);' if perms.view
            defaultAction = 'viewWorkorder' if perms.view
            defaultText = 'View' if perms.view
            defaultHref = 'javascript:void(0);' if perms.hire
            defaultAction = 'hireSeller' if perms.hire
            defaultText = 'Hire' if perms.hire
            defaultHref = 'javascript:void(0);' if perms.edit
            defaultAction = 'editDiagnosis' if perms.edit and project.diagnosis
            defaultAction = 'editWorkorder' if perms.edit and not project.diagnosis
            defaultText = 'Edit' if perms.edit

            if perms.none
                html += '<td><i>N/A</td>'
            else
                html += '<td><div class="mf-button-dropdown"><a href="' + defaultHref + '" class="mf-button main-button ' + defaultAction + '" data-bid="' + estimate._id + '" + data-ids="' + contactIds + '">' + defaultText + '</a><div class="mf-button dropdown-button menu estimateDropdown" id="estimateDropdown' + estimate._id + '"><i class="fa fa-chevron-down estimateDropdownIcon"></i><div class="dropdown"><ul>'
                html += '<li><a class="viewWorkorder" data-bid="' + estimate._id + '" href="javascript:void(0);">View Estimate</a></li>' if perms.view
                html += '<li><a class="hireSeller" data-bid="' + estimate._id + '" href="javascript:void(0);">Hire</a></li>' if perms.hire
                html += '<li><a href="/profile/' + estimate.owner._id + '" target="_blank">View Mechanic</a></li>' if perms.profile
                html += '<li><a class="editDiagnosis" href="javascript:void(0);">Edit Diagnosis</a></li>' if perms.edit and project.diagnosis
                html += '<li><a class="editWorkorder" href="javascript:void(0);">Edit Estimate</a></li>' if perms.edit and not project.diagnosis
                html += '<li><a class="cancelEstimate" data-bid="' + estimate._id + '" href="javascript:void(0);">Cancel Estimate</a></li>' if perms.cancel
                html += '<li><a class="contact-action" data-ids="' + project.assigned._id + '" href="javascript:void(0);">Message</a></li>' if perms.message
                html += '</ul></div></div></td></tr>'

        i++

    if c <= 0
        html += '<tr id="estimateTableNoEstimates">'
        colspan = if project.diagnosis then 7 else 6
        html += '<td colspan="' + colspan + '">There are no estimates placed on this job</td>'
        html += '</tr>'

    return new handlebars.SafeString(html)

handlebars.registerHelper 'profileLists', (items) ->
    return '' unless items

    list = []
    for item in items
        list.push '&#9642; ' + item

    while list.length % 3 isnt 0
        list.push ''

    html = ''
    i = 0
    r = 1
    while i < list.length
        html += '<tr>' if r == 1
        html += '<td>' + list[i] + '</td>'
        html += '</tr>' if r == 3
        r = 1 if r == 3
        i++
        r++

    return new handlebars.SafeString(html)

handlebars.registerHelper 'dayName', (number) ->
    weekDay = [
        'Sunday'
        'Monday'
        'Tuesday'
        'Wednesday'
        'Thursday'
        'Friday'
        'Saturday'
    ]

    return '' unless number of weekDay
    return weekDay[number]

handlebars.registerHelper 'timeDisplay', (number) ->
    meridiem = 'AM'
    meridiem = 'PM' if number > 12
    time = number
    time -= 12 if number > 12

    return time + ':00 ' + meridiem


handlebars.registerHelper 'imageToDataURL', (image) ->
    if image && image.buffer && image.extension
        new handlebars.SafeString('data:image/' + image.extension + ';base64,' + image.buffer.toString('base64'))
    else
        ''

handlebars.registerHelper 'phoneNumber', (number) ->
    if number && typeof number is 'string' && number.length == 10
        areaCode = number.substr(0, 3)
        base = number.substr(3, 3)
        ext = number.substr(6, 4)
        new handlebars.SafeString(areaCode + '-' + base + '-' + ext)
    else
        ''
# where "users" is an array of users:
# {{withKeyValue users "id" "5731dcd35692a39e56df9fbb"}}
handlebars.registerHelper 'hasKeyValue', (objs, key, val, options) ->
    if objs and key and val
        for o in objs
            return options.fn(this) if o[key] is val
    return options.inverse(this)

# where "users" is an array of users:
# {{withKeyValue users "id" "5731dcd35692a39e56df9fbb"}}
handlebars.registerHelper 'withKeyValue', (objs, key, val) ->
    if objs and key and val
        for o in objs
            if o[key] is val
                return o
        return ''
    return ''

# where "tooltips" is an array of tooltip objects and id is the tooltip id to display:
# {{tooltip tooltips "5731dcd35692a39e56df9fbb"}}
handlebars.registerHelper 'tooltip', (tooltips, id) ->
    if tooltips and id
        for t in tooltips
            if t.id is id
                return '<sup class="tooltip-container"><span class="tooltip-icons tooltip_info" href="'+t.href+'" title="' + t.text + '"><i class="fa fa-info-circle"></i></span></sup>'
        return ''
    return ''

handlebars.registerHelper 'transactionCurrency', (number, fromId, viewerId, sign, cents) ->
    from = true
    from = false unless fromId.toString() is viewerId.toString()

    sign = true unless typeof sign is 'boolean'
    cents = true unless typeof cents is 'boolean'

    lp = '('
    lp = '' unless from
    rp = ')'
    rp = '' unless from

    s = '$'
    s = '' unless sign
    number = (number / 100).toFixed 2 if cents
    new handlebars.SafeString(lp + s + humanize.numberFormat(number) + rp)

handlebars.registerHelper 'escrowStatus', (escrowStatus) ->
    ret = '<span title="This transaction occurred as a result of a refund">Returned</span>'
    switch escrowStatus
        when 'hold_pending'
            ret = '<span title="We are currently in the process of moving your funds to escrow">Holding</span>'
        when 'held'
            ret = '<span title="Your funds are securely held in escrow">Held</span>'
        when 'release_pending'
            ret = '<span title="Your funds are being released from escrow">Releasing</span>'
        when 'released'
            ret = '<span title="Your funds have been released from escrow">Released</span>'
        when 'refunded'
            ret = '<span title="You have been refunded">Refunded</span>'

    return new handlebars.SafeString ret

handlebars.registerHelper 'transactionAmount', (transaction, userId, sign, cents) ->
    sign = true unless typeof sign is 'boolean'
    cents = true unless typeof cents is false

    return '' unless userId.toString() in [transaction.from._id.toString(), transaction.to._id.toString()]
    amount = parseFloat(transaction.braintree.amount) * 100
    outflow = false

    if userId.toString() is transaction.from._id.toString()
        outflow = true if transaction.braintree.type is 'sale'
    else
        amount = amount - transaction.referral.seller - transaction.referral.buyer
        outflow = true if transaction.braintree.type is 'credit'

    lp = if outflow then '(' else ''
    rp = if outflow then ')' else ''

    s = '$'
    s = '' unless sign
    amount = (amount / 100).toFixed 2 if cents
    new handlebars.SafeString(lp + s + humanize.numberFormat(amount) + rp)

handlebars.registerHelper 'currency', (number, sign, fromCents, parenthesis) ->
    sign = true unless typeof sign is 'boolean'
    fromCents = true unless typeof fromCents is 'boolean'
    parenthesis = true unless typeof parenthesis is 'boolean'

    flip = false
    if number or number is 0
        if number < 0
            flip = true
            number = number * -1

        lp = '('
        lp = '' unless parenthesis and flip
        rp = ')'
        rp = '' unless parenthesis and flip

        s = '$'
        s = '' unless sign
        number = (number / 100).toFixed 2 if fromCents
        new handlebars.SafeString(lp + s + humanize.numberFormat(number) + rp)
    else
        ''

handlebars.registerHelper 'facebook-share', (options) ->
    user = (options.hash or options).user
    url = "http://www.mechfinder.com/profile/#{user}"
    url = encodeURIComponent(url)
    new handlebars.SafeString("https://www.facebook.com/sharer/sharer.php?u=#{url}")

handlebars.registerHelper 'tags', (tags) ->
    new handlebars.SafeString(("<span class=\"label\">#{t}</span>" for t in tags).join(' '))

# returns a context variable by name, useful for retrieving form values in input partial
# has smarts to also check the name as to_input_name would have mangled it
handlebars.registerHelper 'get', (x) ->
    a = this[x] ? this[x.replace /[-.]/g, '_']

# usage {{#hash stuff}}<li>{{key}} = {{value}}</li>{{/hash}}
# iterates over key/value pairs in first argument
handlebars.registerHelper 'hash', (hash, options) ->
	return if not hash
	data = shallow this
	(options.fn(merge data, key: key, value: value) for own key, value of hash).join('')

# usage: {{helper 'fields/text' a="b" c="d" ... }}
# renders the partial at 'helpers/fields/text' using the hash
# arguments merged into the current context.
handlebars.registerHelper 'helper', (partial, options) ->
    data = union this, options.hash
    path = "helpers/#{partial}"
    partial = handlebars.partials[path]
    if not partial
        throw "No partial found named '#{path}'."
    return new handlebars.SafeString(partial(data))

# {{#compare a to="b"}}equal{{else}}not equal{{/compare}}
# {{#compare a gt="b"}}a > b{{else}}not equal{{/compare}}
# {{#compare a gte="b"}}a >= b{{else}}not equal{{/compare}}
# {{#compare a lt="b"}}a < b{{else}}not equal{{/compare}}
# {{#compare a lte="b"}}a <= b{{else}}not equal{{/compare}}
handlebars.registerHelper 'compare', (a, options) ->
    return unless options.hash?
    return options.fn(this) if options.hash.to  isnt undefined and a == options.hash.to
    return options.fn(this) if options.hash.gt  isnt undefined and a >  options.hash.gt
    return options.fn(this) if options.hash.gte isnt undefined and a >= options.hash.gte
    return options.fn(this) if options.hash.lt  isnt undefined and a <  options.hash.lt
    return options.fn(this) if options.hash.lte isnt undefined and a <= options.hash.lte
    return options.inverse(this)

# {{#compareOr user.role to="buyer,seller,admin"}}
handlebars.registerHelper 'compareOr', (a, options) ->
    return unless options.hash?
    key = 'to'
    key = 'not' if options.hash.not isnt undefined
    key = 'gt'  if options.hash.gt  isnt undefined
    key = 'gte' if options.hash.gte isnt undefined
    key = 'lt'  if options.hash.lt  isnt undefined
    key = 'lte' if options.hash.lte isnt undefined
    
    vals = options.hash[key].split ','
    for val in vals
        switch key
            when 'to'   then return options.fn(this) if a == val
            when 'not'  then return options.fn(this) if a != val
            when 'gt'   then return options.fn(this) if a > val
            when 'gte'  then return options.fn(this) if a >= val
            when 'lt'   then return options.fn(this) if a < val
            when 'lte'  then return options.fn(this) if a <= val
    return options.inverse(this)

handlebars.registerHelper 'lastEstimateIdByUser', (userId, estimates) ->
    estimateId = ''
    for estimate in estimates
        estimateId = estimate._id if estimate.owner._id.equals userId
    return estimateId

handlebars.registerHelper 'hasRequestedEstimate', (userId, estimates, options) ->
    return '' if arguments.length < 3
    for estimate in estimates
        return options.fn this if estimate.owner._id.equals(userId) and estimate.state is 'requested'
    return options.inverse this

handlebars.registerHelper 'hasHiredEstimate', (userId, estimates, options) ->
    return '' if arguments.length < 3
    for estimate in estimates
        return options.fn this if estimate.owner._id.equals(userId) and estimate.state is 'accepted'
    return options.inverse this

handlebars.registerHelper 'hasSubmittedEstimate', (userId, estimates, options) ->
    return '' if arguments.length < 3
    i = 0
    while i < estimates.length
        return options.fn this if estimates[i].owner._id.equals(userId) and estimates[i].state is 'submitted'
        i++
    return options.inverse this

handlebars.registerHelper 'hasActiveEstimates', (estimates, options) ->
    reutnr '' if arguments.length < 2
    for estimate in estimates
        return options.fn this if estimate.state in ['submitted', 'accepted', 'requested']
    return options.inverse this


handlebars.registerHelper 'sameID', (a, b, options) ->
    return '' if arguments.length < 3
    return options.inverse this unless a and b
    return options.fn this if a.toString() is b.toString()
    return options.inverse this

handlebars.registerHelper 'diffID', (a, b, options) ->
    return '' if arguments.length < 3
    return options.fn this unless a and b
    return options.fn this unless a.toString() is b.toString()
    return options.inverse this

handlebars.registerHelper 'comarestate', (a, options) ->
    return unless options.hash?
    return options.fn(this) if options.hash.to  isnt undefined and options.hash.another  isnt undefined and  a == options.hash.to or a == options.hash.another
    return options.inverse(this)

# {{#compare_document a to="b"}}equal{{else}}not equal{{/compare}}
handlebars.registerHelper 'compare_document', (a, options) ->
    ix = options.hash?.index
    to = options.hash?.to
    to = to[ix] if ix?
    if compare_document(a, to) then options.fn(this) else options.inverse(this)

# usage: {{map a x="1" y="2" z="3"}}
# evaluates 'a' and compares it to the values x, y, or z, rendering the
# matching value. In the example, if 'a' were 'y', the output would be '2'.
handlebars.registerHelper 'map', (a, options) ->
    return val for own key, val of options.hash when key is a

# usage: {{contains ../user.friends needle=_id}}
handlebars.registerHelper 'contains', (a, options) ->
    needle = options.hash?.needle
    for x in a
        if x is needle
            return options.fn(this)
    return options.inverse(this)

# usage: {{#within _id array}}Is found{{else}}is not found{{/within}}
handlebars.registerHelper 'within', (item, list, options) ->
    return '' unless list and item
    if list.indexOf(item) > -1
        return options.fn this
    return options.inverse this

# usage: {{#listItems 0 5 array}} {{this}} {{/listItems}}
handlebars.registerHelper 'listItems', (from, to, context, options) ->
    item = ''
    i = from
    j = to
    while i < j
        item = item + options.fn(context[i])
        i++
    return item

# usage: {{#defined a}}a is defined{{else}}a is undefiend{{/defined}}
handlebars.registerHelper 'defined', (a, options) -> if a is undefined then options.inverse(this) else options.fn(this)

handlebars.registerHelper 'pagination', (a, options) ->
    options = a unless options
    {size, index, total} = options.hash

    ideal = options.hash.ideal or 7
    pages = Math.ceil(total/size)

    first = last = index
    while last-first < ideal*(size-1) and (first-size >= 0 or last+size <= total)
        if last+size <= total
            last += size
        if first-size >= 0 and last-first < ideal*(size-1)
            first -= size

    buf = []
    buf.push options.fn(index: 0, label: 'First', active: index is 0)
    i = first
    while i <= last
        buf.push options.fn(index: i, label: 1 + (i/size), active: index >= i and index < i+size)
        i += size
    buf.push options.fn(index: size * Math.floor(total/size), label: 'Last', active: index is size * Math.floor(total/size))
    return buf.join('\n')

handlebars.registerHelper 'ifpath', (path, options) -> options.hash?.then if this.path == path
