util = require('./util')

merge = util.merge
union = util.union

createList = (paths, fields) ->
    fields ?= (key for key, path of paths when key not in ['_id', 'id'])
    paths[key] for key in fields

class BaseWidget

    constructor: (@name, @opts) ->
        @controlId = "input-#{util.slug @name}"
        @example = (if @opts.example then @opts.example else '')

    renderLabel: (id, title) ->
        id ?= @controlId
        title ?= @opts.title
        """<label class="control-label" for="#{id}">#{title}</label>"""

    renderField: (content) -> 
        help = if @opts.help then """<p class="help-block">#{@opts.help}</p>""" else ''
        """
        <div class="control-group">
            #{@renderLabel()}
            <div class="controls">
                #{content}
                #{help}
            </div>
        </div>
        """

class NumberWidget extends BaseWidget
    constructor: (@name, @opts) ->
        super @name, @opts
        @listMarkup = """<td data-bind="number: #{@name}"></td>"""
        @fieldMarkup = @renderField """
        <input type="text" id="#{@controlId}"
            data-bind="value: #{@name}"
            placeholder="#{@example}"
            class="input-small"
        />
        """

class TextWidget extends BaseWidget
    constructor: (@name, @opts) ->
        super @name, @opts
        @listMarkup = """<td data-bind="text: #{@name}"></td>"""
        @fieldMarkup = @renderField """
        <input type="text" id="#{@controlId}"
            data-bind="value: #{@name}"
            placeholder="#{@example}"
            class="input-small"
        />
        """


class UrlWidget extends BaseWidget
    constructor: (@name, @opts) ->
        super @name, @opts
        @listMarkup = """
        <a data-bind="attr: { href: 'http:// ' + #{@name}() }" target="_new">
            <i class="icon-globe"></i><span data-bind="text: #{@name}"></span>
        </a>
        """
        @fieldMarkup = @renderField """
        <input type="text" id="#{@controlId}"
            data-bind="value: #{@name}"
            placeholder="#{@example}"
            class="input-small"
        />
        """

class DateWidget extends BaseWidget
    constructor: (@name, @opts) ->
        super @name, @opts
        @listMarkup = """<td data-bind="date: #{@name}"></td>"""
        @fieldMarkup = @renderField """
        <input type="text" id="#{@controlId}"
            data-bind="date: #{@name}"
            placeholder="#{@example}"
            class="input-small input-date"
        />
        """
class BoolWidget extends BaseWidget
    constructor: (@name, @opts) ->
        super @name, @opts
        @listMarkup = """<td><i data-bind="visible: #{@name}" class="icon-check"></i></td>"""
        @fieldMarkup = @renderField """
        <label class="checkbox">
            <input type="checkbox" id="#{@controlId}" value="true" data-bind="checked: #{@name}" />
            #{!@example}
        </label>
        """

exports.Admin = class Admin
    constructor: (@schema, opts) ->

        # deep-copy the schema's path structure, leave out some stuff we
        # dont need (getters, setters, stuff we cant use in the client),
        # merge options down one nesting level
        opts ?= {}
        @paths = {}
        for own path, values of @schema.schema.paths
            @paths[path] = {}
            for own key, val of values when key not in ['getters', 'setters', 'options']
                @paths[path][key] = val if (typeof val isnt 'undefined' and
                                            val != null and
                                            (typeof val.length is 'undefined' or val.length > 0))
            merge @paths[path], values.options
            @paths[path].title ?= util.title path

        # merge in anything explicity passed to the admin
        for own path, values of opts.paths
            merge @paths[path], values if @paths[path]

        # assign default widgets
        for own path, values of @paths
            switch values.type
                when String
                    values.type = 'string'
                    values.widget = new TextWidget(path, values)
                when Date
                    values.type = 'date'
                    values.widget = new DateWidget(path, values)
                when Boolean
                    values.type = 'bool'
                    values.widget = new BoolWidget(path, values)
                when Number
                    values.type = 'number'
                    values.widget = new NumberWidget(path, values)

        # form definitions are just subsets of @paths
        @edit = createList @paths, opts?.edit
        @new  = createList @paths, opts?.new
        @list = createList @paths, opts?.list

        @name = @schema.modelName
        @title = util.title @name
        @set ?= util.plural util.lower(@name)

