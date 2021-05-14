
(($) ->
    $.fn.imagePicker = (opts) ->
        opts = $.extend({width: 161, height: 149, scaling: 'i'}, opts)
        this.each ->
            $picker = $(this)
            $progress = $picker.find('.progress')
            $preview = $picker.find('.preview')
            uploader = new qq.FineUploaderBasic(
                button: $picker[0]
                request: { endpoint: '/i' }
                multiple: false
                validation: {
                    acceptFiles:     'image/*'
                    sizeLimit:    10*1024*1024 # 10 Mb
                    minSizeLimit:         1024 #  1 Kb
                }
                callbacks: {
                    onUpload: (id) ->
                        $picker.find('i').remove()
                        $progress.show().find('.bar').css('width', '0%')
                        $preview.hide()

                    onProgress: (id, filename, uploaded, total) ->
                        percent = Math.floor(100*uploaded/total)
                        $progress.find('.bar').css('width', percent + '%')
                        $progress.addClass('progress-striped active') if percent >= 99

                    onComplete: (id, filename, data) ->
                        $picker.find('input[type="hidden"]').val(data.id)
                        console.dir(data)
                        $progress.hide()
                        $preview.show().css('background', 'url("/i/' + data.id + '/' + opts.width + '/' + opts.height + '/' + opts.scaling + '") no-repeat center')
                }
            )

    $.fn.albumPicker = (opts) ->
        opts = $.extend({
                maxImages: 8
                width: 161
                height: 149
                scaling: 'i'
                picker: '.picker'
                thumbnails: '.thumbnails'
                viewer: '.viewer'
                name: 'pictures'
            }, opts)
        this.each ->
            $this = $(this)
            $picker = $this.find(opts.picker)
            $thumbnails = $this.find(opts.thumbnails)
            $viewer = $this.find(opts.viewer)
            uploader = new qq.FineUploaderBasic(
                button: $picker[0]
                request: { endpoint: '/i' }
                multiple: true
                validation: {
                    acceptFiles:     'image/*'
                    sizeLimit:    10*1024*1024 # 10 Mb
                    minSizeLimit:         1024 #  1 Kb
                }
                callbacks: {
                    onSubmit: (id, filename) ->
                        return false if $thumbnails.find('li').length >= opts.maxImages
                        $thumbnails.append(
                            "<li class=\"span4\" data-file-id=\"#{id}\">
                                <div style=\"white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\">#{filename}</div>
                                <div class=\"progress\"><div class=\"bar\" style=\"width: 0%;\"></div></div>
                            </li>")

                    onProgress: (id, filename, uploaded, total) ->
                        $pb = $thumbnails.find('li[data-file-id="' + id + '"] .bar')
                        percent = Math.floor(100*uploaded/total)
                        $pb.css('width', percent + '%')
                        $pb.closest('.progress').addClass('progress-striped active') if percent >= 99

                    onComplete: (id, filename, data) ->
                        $li = $thumbnails.find('li[data-file-id="' + id + '"]')
                        $li.data('image-id', data.id)
                        $li.empty()
                        $li.append('<input type="hidden" name="' + opts.name + '" value="' + data.id + '"/>')
                        $li.prepend(
                            "<div class=\"thumbnail\">
                                <img src=\"/i/#{data.id}/#{opts.width}/#{opts.height}/#{opts.scaling}\"/> 
                                <div style=\"margin-top: 5px;\">
                                    <button class=\"pull-right btn btn-danger btn-mini\"><i class=\"icon-trash\"></i>Remove</button>
                                    <div style=\"white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\">#{filename}</div>
                                </div>
                            </div>")
                        $li.find('button.btn-danger').click(remove_picture)
                        $li.find('img').click(view_picture)
                        $viewer.find('.carousel-inner').empty()
                }
            )
            
            remove_picture = ->
                $(this).closest('li').remove()
                $viewer.find('.carousel-inner').empty()

            view_picture = ->
                id = $(this).closest('li').data('image-id')
                $items = $viewer.find('.carousel-inner')
                $items.find('.active').removeClass('active')
                if $items.find('*').length is 0
                    $thumbnails.find('img').each ->
                        x = $(this).closest('li').data('image-id')
                        $items.append('<div class="item" data-image-id="' + x + '"><img src="/i/' + x + '/800/600/i"/></div>')
                $items.find('.item[data-image-id="' + id + '"]').addClass('active')
                $viewer.modal()

            $thumbnails.find('button.btn-danger').click(remove_picture)
            $viewer.find('.carousel').carousel(interval: false)
            $viewer.click (e) ->
                return if $(e.target).is('.carousel-control')
                $viewer.modal('hide')

)(jQuery)