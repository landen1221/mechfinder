fs = require('fs')

COUNTRY_POSITION             = [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
REGION_POSITION              = [0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
CITY_POSITION                = [0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
ISP_POSITION                 = [0, 0, 3, 0, 5, 0, 7, 5, 7, 0, 8, 0, 9, 0, 9, 0, 9, 0, 9, 7, 9]
LATITUDE_POSITION            = [0, 0, 0, 0, 0, 5, 5, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
LONGITUDE_POSITION           = [0, 0, 0, 0, 0, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
DOMAIN_POSITION              = [0, 0, 0, 0, 0, 0, 0, 6, 8, 0, 9, 0, 10, 0, 10, 0, 10, 0, 10, 8, 10]
ZIPCODE_POSITION             = [0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 7, 7, 7, 0, 7, 0, 7]
ZIPCODE_POSITION             = [0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 7, 7, 7, 0, 7, 0, 7, 7, 7, 0, 7]
TIMEZONE_POSITION            = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 7, 8, 8, 8, 7, 8, 0, 8]
NETSPEED_POSITION            = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 11,0, 11,8, 11, 0, 11]
IDDCODE_POSITION             = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 12, 0, 12, 0, 12]
AREACODE_POSITION            = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10 ,13 ,0, 13, 0, 13]
WEATHERSTATIONCODE_POSITION  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 14, 0, 14]
WEATHERSTATIONNAME_POSITION  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 15, 0, 15]
MCC_POSITION                 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 16]
MNC_POSITION                 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10,17]
MOBILEBRAND_POSITION         = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11,18]

IPV4 = 0
IPV6 = 1

compute_ip_number = (ip) ->
    return null unless ip
    parts = ip.split('.')
    return (Number(parts[0]) * 256 * 256 * 256) +
           (Number(parts[1]) * 256 * 256) +
           (Number(parts[2]) * 256) +
           (Number(parts[3]))

class IpLocator

    constructor: (@buf) ->
        @header =
            type:    @read8(1)
            columns: @read8(2)
            year:    @read8(3)
            month:   @read8(4)
            day:     @read8(5)
            count:   @read32(6)
            address: @read32(10)
            ip:      @read32(14)

        if @header.ip == IPV6
            throw 'IPV6 location currently not supported.'

    read8: (position) -> @buf.readUInt8(position-1)
    read32: (position) -> @buf.readUInt32LE(position-1)

    read_string_field: (n, map) ->
        return null if map[@header.type] == 0
        x = @read32(@header.address + (n * @header.columns * 4) + ((map[@header.type]-1) * 4))
        length = @buf.readUInt8(x)
        return @buf.toString('ascii', x+1, x+1+length)

    read_float_field: (n, map) ->
        return null if map[@header.type] == 0
        return @buf.readFloatLE(@header.address - 1 + (n * @header.columns * 4) + ((map[@header.type]-1) * 4))

    record: (n) ->
        return {
            lat:     @read_float_field(n, LATITUDE_POSITION)
            long:    @read_float_field(n, LONGITUDE_POSITION)
            city:    @read_string_field(n, CITY_POSITION)
            state:   @read_string_field(n, REGION_POSITION)
            postal:  @read_string_field(n, ZIPCODE_POSITION)
            country: @read_string_field(n, COUNTRY_POSITION)
        }

    locate: (ip) ->
        ipno = compute_ip_number(ip)
        [low, mid, high] = [0, 0, @header.count]
        while low <= high
            mid = Math.floor((high + low)/2)
            ipfrom = @read32(@header.address + mid * @header.columns * 4)
            ipto = @read32(@header.address + (mid+1) * @header.columns * 4)

            if ipno >= ipfrom and ipno < ipto
                return @record(mid)
            if ipno < ipfrom
                high = mid-1
            else
                low = mid+1
        return null

exports.open = (file) ->
    # fd = fs.openSync(file, 'r')
    # size = fs.fstatSync(fd).size
    buffer = fs.readFileSync(file) #mmap.map(size, mmap.PROT_READ, mmap.MAP_SHARED, fd, 0)
    return new IpLocator(buffer)
