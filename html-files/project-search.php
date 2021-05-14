<?php include("header.php"); ?>

<div class="container">

	<div class="row">
		
		<div class="col-xs-12 col-sm-3">
			<?php include("menu-left.php"); ?>
			
				<div class="row">
					<div class="col-super-x-12">
						<?php include("calendar.php"); ?>
					
						<!-- Only else id for stars(Good W3C). Right id file online-costumers.php -->
						<?php include("online-customers-left.php"); ?>
					</div>
				</div>
		</div>
		
		<div class="col-xs-12 col-super-x-9 col-sm-6">
	
			<div class="row">		
				<div class="col-xs-12">
     <h2>Project Search</h2>

     <form class="search-projects">
         <input class="form-control" type="text" placeholder="Location, Project name/ID or Service"/>
         <div class="row project-search-inputs">
			<div class="col-xs-12">
				 <div class="custom-grid-36">
					 <select class="form-control">
						 <option>State</option>
						 <option>2</option>
						 <option>3</option>
						 <option>4</option>
						 <option>5</option>
					 </select>
				 </div>
				 <div class="custom-grid-36">
					 <select class="form-control">
						 <option>City</option>
						 <option>2</option>
						 <option>3</option>
						 <option>4</option>
						 <option>5</option>
					 </select>
				 </div>
				 <div class="custom-grid-28">
					 <button type="button" class="btn search-btn"><span class="glyphicon glyphicon-search"></span> SEARCH</button>
				 </div>
			</div> 
         </div>

     </form>
	 
  <h2>Local Projects Nearest You</h2>

<div class="table-responsive">
<table class="table table-striped project-search-table">
             <thead>
             <tr>
                 <th>Date</th>
                 <th>Location</th>
                 <th>Estimates</th>
                 <th>Service Needed</th>
                 <th>Vechicle</th>
                 <th>Budget</th>
             </tr>
             </thead>
             <tbody>
             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>
             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>
             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>
             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>
             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr><tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr><tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>



             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>
             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>
             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>
             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>
             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr> <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr> <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>
             <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr> <tr>
                 <th scope="row">14/24/2015</th>
                 <td>Los Angeles</td>
                 <td>32</td>
                 <td>Auto repair</td>
                 <td>Ford Focus</td>
                 <td>$2000</td>
             </tr>


             </tbody>
         </table>
</div>
		 
         <div class="table-pagination text-center">
             <nav>
                 <ul class="pagination">
                     <li>
                         <a href="#" > First
                         </a>
                    </li>
                     <li class="active"><a href="#">1</a></li>
                     <li><a href="#">2</a></li>
                     <li><a href="#">3</a></li>
                     <li><a href="#">4</a></li>
                     <li><a href="#">5</a></li>
                     <li><a href="#">6</a></li>
                    <li>
                         <a href="#"> Last
                         </a>
                     </li>
                 </ul>
             </nav>
         </div>
     	 
				</div>
			</div>
			
		</div>
		
		<div class="col-xs-12 col-super-x-0 col-sm-3">
			<?php include("calendar.php"); ?>
			
			<?php include("online-customers.php"); ?>
		</div>
		
	</div>

</div>

<?php include("footer.php"); ?>
