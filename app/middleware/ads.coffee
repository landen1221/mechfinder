moment = require('moment')
handlebars = require('handlebars')
{Ad} = require('../models')
{normalize_state} = require('../util')

# {{ad section=ads.banner state=geo.state}}
handlebars.registerHelper 'ad', (options) ->

    try

        # figure out a normalized state name
        geo = options.hash.geo
        state = if geo then (normalize_state(geo.country, geo.state)) else '-'
        city = (if geo then geo.city else '-').toLowerCase()

        # validate there is at least one valid ad in this section
        section = (options.hash.section or [])
        return unless section.length > 0

        # what kind of ad should we show?
        type = options.hash.type or 'nation'

        # city
        if type is 'city' and state isnt '-' and city isnt '-'
            valid = (x for x in section when x.state is state and 
                                             x.city_lower is city)

            # fallback to a state level ad if we couldnt find one for the city
            type = 'state' if valid.length is 0
        
        # state
        if type is 'state' and state isnt '-'
            valid = (x for x in section when x.state is state and 
                                             (x.city is undefined or x.city is null or x.city is ''))
            
            # fallback to a national level ad if we couldnt find one for the state
            type = 'nation' if valid.length is 0

        
        # nationwide ad
        if type is 'nation' or not type?
            valid = (x for x in section when (x.state is undefined or x.state is null or x.state is '') and 
                                            (x.city is undefined or x.city is null or x.city is ''))
        
        # if no ads match, just use any ad whatsoever
        valid = section unless valid?.length
        
        # garaunteed at least one at this point
        i = Math.floor(Math.random()*valid.length)
        a = valid[i]

        # need to remove this ad from the list so we never show it twice on the same page
        section.splice(section.indexOf(a), 1)

        # record the view, ignore failures
        options.hash.record(a) if options.hash.record?

        return new handlebars.SafeString(
            "<div style=\"margin-top: 20px;\">
                <a target=\"_blank\" href=\"/clickthrough/#{a._id}\" class=\"ad #{a.section}\">
                    <img src=\"#{a.image_url}\"/>
                </a>
                <span>#{a.phone or ''}</span>
            </div>"
        )

    catch err

        console.log "Error rendering ad: #{err}"
        return new handlebars.SafeString("<!-- error rendering ad -->")

module.exports = () -> 
    (req, res, next) ->
        return next() if req.xhr    # no ads on ajax requests
        Ad.find_active (err, ads) ->
            res.send 500, err if err
            res.locals.ads = ads
            res.locals.record_ad_view = (ad) -> ad.record_view(req, null)
            next()