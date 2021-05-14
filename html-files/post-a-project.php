<?php include("header.php"); ?>

<div class="container">

	<div class="row">
		
		<div class="col-xs-12 col-sm-8 col-md-9">
		
					
			<div class="row">		
				<div class="col-xs-12">

	<div class="info-page-content"><h1>Post a Project</h1></div>				
					
			
			<div class="post-a-project-new">
				<div class="row">
					<div class="col-xs-12 col-md-3 col-lg-2">
						<label>Projects Name:</label>
					</div>
					<div class="col-xs-12 col-md-3 col-lg-5">
						 <input type="text" placeholder="Ford" value="" required />
					</div>
					<div class="col-xs-12 col-md-3 col-lg-3">
						<label>Must by Completed By:</label>
					</div>		
					<div class="col-xs-12 col-md-3 col-lg-2">					
						<div id="sandbox-container"><input type="text" type="text" ></div>	
					</div>
				</div>
				
				<div class="row">
					<div class="col-xs-12 col-md-3 col-lg-2">
						<label>Vehicle Make</label>
					</div>
					<div class="col-xs-12 col-md-3 col-lg-4">
						<input type="text" placeholder="Ford" value="" required />
					</div>
					<div class="col-xs-12 col-md-3 col-lg-2">
						<label>Vehicle Model</label>
					</div>
					<div class="col-xs-12 col-md-3 col-lg-4">
						<input type="text" placeholder="Focus" value="" required />
					</div>
				</div>
				
				<div class="row">
					<div class="col-xs-12 col-md-3 col-lg-2">
						<label>Vehicle Year</label>
					</div>
					<div class="col-xs-12 col-md-3 col-lg-4">
						<input type="text" placeholder="2002" value="" required />
					</div>
					<div class="col-xs-12 col-md-3 col-lg-2">
						<label>Service</label>
					</div>
					<div class="col-xs-12 col-md-3 col-lg-4">
							<select name="repair">
								<option value="0" >Auto Repair</option>
								<option value="1" >Auto Body</option>
								<option value="2" >Roadside Assistance</option>
								<option value="3" >Restoration Job</option>
								<option value="4" >New Tires</option>
								<option value="4" >New Windshield</option>
							</select>
					</div>
				</div>	

				<div class="row">
					<div class="col-xs-12 col-md-3 col-lg-2">
						<label>Description</label>
					</div>
					
					<div class="col-xs-12 col-md-9 col-lg-10">
						<textarea placeholder="My car keeps overheating afer I drive for about 20 minutes..."></textarea>
					</div>					
				</div>
				
				<div class="row">
					<div class="col-xs-12 col-md-3 col-lg-5">
						<label>Do you have the parts?</label>
					</div>
					
					<div class="col-xs-12 col-md-3 col-lg-2">
								<span><input type="radio" value="1" required /> Yes</span>
								<span><input type="radio" value="0" required /> No</span>
					</div>	

					<div class="col-xs-12 col-md-3 col-lg-3">
						<label>Do you need a Tow?</label>
					</div>
					
					<div class="col-xs-12 col-md-3 col-lg-2">
								<span><input type="radio" value="1" required /> Yes</span>
								<span><input type="radio" value="0" required /> No</span>
					</div>						
				</div>
				
				<div class="row mB24">
					<div class="col-xs-12 col-md-3 col-lg-5">
							<label>Acceptable Parts for this Job <a href="#" data-placement="bottom" title="" data-original-title="Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sed orci fringilla, consectetur eros ut, pharetra urna. Mauris non pharetra eros. Aenean malesuada ultricies massa, ac pulvinar nulla tempor iaculis. Fusce et quam orci. In malesuada posuere nulla eu ornare. Phasellus ac porttitor magna. Nullam efficitur ligula eget arcu sagittis, sit amet congue nisi aliquam." class="blue-tooltip-d"><strong class="form-tooltip">?</strong></a></label>
					</div>
					
					<div class="col-xs-12  col-md-9 col-lg-7">
								<span><input type="radio" value="1" required /> OEM/New</span>
								<span><input type="radio" value="0" required /> Used</span>
								<span><input type="radio" value="3" required /> Aftermarket</span>
								<span><input type="radio" value="3" required /> Remanufactured</span>
					</div>	
				</div>
				
				<div class="row">
					<div class="col-xs-12">
						<?php include("duplicate-hours.php"); ?>
					</div>
					
					
					<div class="col-xs-12">
						<div class="gallery-post form">
							<a href="#"><img src="images/car1.jpg" alt="" />
								<div><button class="btn">Delete</button></div>
							</a>
							<a href="#"><img src="images/car2.jpg" alt="" />
								<div><button class="btn">Delete</button></div>
							</a>
							<a href="#"><img src="images/car1.jpg" alt="" />
								<div><button class="btn">Delete</button></div>
							</a>
							<a href="#"><img src="images/car2.jpg" alt="" />
								<div><button class="btn">Delete</button></div>
							</a>
							<a href="#"><img src="images/car1.jpg" alt="" />
								<div><button class="btn">Delete</button></div>
							</a>
							<a href="#"><img src="images/car2.jpg" alt="" />
								<div><button class="btn">Delete</button></div>
							</a>
							<a href="#"><img src="images/car1.jpg" alt="" />
								<div><button class="btn">Delete</button></div>
							</a>
							<a href="#"><img src="images/car2.jpg" alt="" />
								<div><button class="btn">Delete</button></div>
							</a>
							<a href="#"><img src="images/car2.jpg" alt="" />
								<div><button class="btn">Delete</button></div>
							</a>
							<a href="#" class="add-image"><i class="fa fa-picture-o"></i>
							<div><button class="btn addphoto">Add Photo</button></div>
							</a>
						</div> 
					</div>
				</div>
				
				<div class="row">
					<div class="col-xs-6 mB24">
						<input type="submit" value="Save as Draft" class="btn basic-save right-form-button" />
					</div>
					
					<div class="col-xs-6 mB24">
						<input type="submit" value="Post this Project" class="btn btn-success" />
					</div>
				</div>
				
				
			</div>	
		</div>	
			</div>
			</div>
		<div class="col-xs-12 col-sm-4 col-md-3">		
	<?php include("placeholder-for-ads.php"); ?>
		</div>
		
	</div>

</div>

<?php include("footer.php"); ?>
